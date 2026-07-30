import { Router } from 'express'
import { prisma } from '../db.ts'
import { requireAuth, requireRole } from '../middleware/auth.ts'

const router = Router()

router.get('/', async (_req, res) => {
    const fund = await prisma.masterFund.findFirst()
    res.json(fund)
})

// Adjusts the fund total and logs it so it and it shows up on the ledger
router.patch('/', requireAuth, requireRole('director'), async (req, res) => {
    const amount = Number(req.body.amount)
    const note = req.body.note ?? 'Manual adjustment'
    if (!Number.isFinite(amount)) return res.status(400).json({ error: 'amount must be a number' })

    const fund = await prisma.masterFund.findFirst()
    if (!fund) return res.status(404).json({ error: 'Master fund not initialized' })

    const [, updatedFund] = await prisma.$transaction([
        prisma.fundAdjustment.create({ data: { amount, note } }),
        prisma.masterFund.update({ where: { id: fund.id }, data: { balance: fund.balance + amount } }),
    ])
    res.json(updatedFund)
})

// fund.balance is the fixed total allocation; approved/pending are summed from Request rather than tracked as separate counters
async function computeSummary() {
    const fund = await prisma.masterFund.findFirst()
    const fundTotal = fund?.balance ?? 0

    const [approvedAgg, pendingAgg] = await Promise.all([
        prisma.request.aggregate({ where: { status: 'approved' }, _sum: { totalCost: true } }),
        prisma.request.aggregate({ where: { status: 'pending' }, _sum: { totalCost: true } }),
    ])
    const approvedTotal = approvedAgg._sum.totalCost ?? 0
    const pendingTotal = pendingAgg._sum.totalCost ?? 0
    const remaining = fundTotal - approvedTotal - pendingTotal
    const usedPct = fundTotal > 0 ? Math.round(((approvedTotal + pendingTotal) / fundTotal) * 100) : 0

    return { fundTotal, approvedTotal, pendingTotal, remaining, usedPct }
}

router.get('/summary', async (_req, res) => {
    res.json(await computeSummary())
})

router.get('/categories', async (_req, res) => {
    const approvedRequests = await prisma.request.findMany({
        where: { status: 'approved' },
        include: { items: { include: { quotes: { where: { isSelected: true } } } } },
    })

    const totals = new Map<string, number>()
    for (const request of approvedRequests) {
        for (const item of request.items) {
            const selectedQuote = item.quotes[0]
            const cost = selectedQuote ? selectedQuote.unitPrice * item.quantity : 0
            const category = item.category ?? 'Uncategorized'
            totals.set(category, (totals.get(category) ?? 0) + cost)
        }
    }

    const categories = [...totals.entries()].map(([category, amount]) => ({ category, amount }))
    res.json(categories)
})

// chronological
router.get('/ledger', async (_req, res) => {
    const [adjustments, requests] = await Promise.all([
        prisma.fundAdjustment.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.request.findMany({
            where: { status: { in: ['approved', 'pending'] } },
            include: { items: { include: { quotes: { where: { isSelected: true } } } } },
            orderBy: { createdAt: 'asc' },
        }),
    ])

    function describeRequest(request: (typeof requests)[number]) {
        if (request.items.length === 0) return `Request #${request.id}`
        if (request.items.length === 1) {
            const item = request.items[0]
            const vendor = item.quotes[0]?.vendorName
            return vendor ? `${vendor} – ${item.name}` : item.name
        }
        return request.items.map((item) => item.name).join(', ')
    }

    const entries = [
        ...adjustments.map((adj) => ({
            date: adj.createdAt,
            description: adj.note,
            type: adj.amount >= 0 ? 'Deposit' : 'Adjustment',
            amount: adj.amount,
        })),
        ...requests.map((request) => ({
            date: request.approvedAt ?? request.createdAt,
            description: describeRequest(request),
            type: request.status === 'approved' ? 'Expense (Approved)' : 'Expense (Pending)',
            amount: -request.totalCost,
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    let runningBalance = 0
    const ledger = entries.map((entry) => {
        runningBalance += entry.amount
        return { ...entry, runningBalance }
    })

    res.json(ledger)
})

export default router
