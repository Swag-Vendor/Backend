import { Router } from 'express'
import { prisma } from '../db.ts'
import { requireAuth, requireRole } from '../middleware/auth.ts'

const router = Router()

router.post('/', async (req, res) => {
    const request = await prisma.request.create({
        data: {
            userId: req.body.userId,
            totalCost: req.body.totalCost,
            items: {
                connect: (req.body.itemIds ?? []).map((id: number) => ({ id })),
            },
        },
        include: { items: true },
    })
    res.json(request)
})

type FullItemInput = {
    name: string
    description?: string
    category?: string
    quantity: number
    vendorName: string
    unitPrice: number
    fulfillment?: string
}

router.post('/full', async (req, res) => {
    const userId: number = req.body.userId
    const items:FullItemInput[] = req.body.items ?? []

    if (!userId || items.length === 0) {
        return res.status(400).json({ error: 'user id required'})
    }

    for (const it of items) {
        if (!it.name || !it. vendorName || it.quantity == null || ite.unitPrice == null) {
            return res.status(400).json({ error: 'each item needs name, vendorName, quantity, unitPrice '})
        }
    }

    const totalCost = items.reduce((s,it) => s + it.unitPrice * it.quantity, 0)

    const request = await prisma.$transaction(async (tx) => {
        const created = await tx.request.create({
            data: { userId, totalCost },
        })

        /*
          There is probally a better way of doing this
          however this works for right now
        */

        for (const it of items) {
            await tx.swagItem.create({
                data: {
                    name: it.name,
                    description: it.description,
                    category: it.category,
                    quantity: it.quantity,
                    requestId: created.id,
                    quotes: {
                        create: {
                            vendorName: it.vendorName,
                            unitPrice: it.unitPrice,
                            fulfillment: it.fulfillment,
                            isSelected: true,
                        },
                    },
                },
            })
        }

        return tx.request.findUnique({
            where: { id: created.id },
            include: { items: { include: { quotes: true } }, user: true },
        })
    })

    res.json(request)
})

router.get('/', async (_req, res) => {
    const requests = await prisma.request.findMany({
        where: { status: 'pending' },
        include: { items: true, user: true },
    })
    res.json(requests)
})


router.post('/:id/approve', requireAuth, requireRole('director'), async (req, res) => {
    const id = Number(req.params.id)

    /*
     * All wrapped in prisma.$transaction so if any step fails, nothing gets committed
     */

    const result = await prisma.$transaction(async (tx) => {
        const request = await tx.request.findUnique({ where: { id } })
        if (!request) throw new Error('Request not found')
        if (request.status !== 'pending') throw new Error('Request not pending')

        const fund = await tx.masterFund.findFirst()
        if (!fund) throw new Error('Master fund not initialized')

        // fund.balance is the fixed total allocation; remaining is derived from
        // approved + still-pending requests rather than decremented in place,
        // so it stays consistent with GET /master-fund/summary.
        const [approvedAgg, pendingAgg] = await Promise.all([
            tx.request.aggregate({ where: { status: 'approved' }, _sum: { totalCost: true } }),
            tx.request.aggregate({ where: { status: 'pending' }, _sum: { totalCost: true } }),
        ])
        const remaining = fund.balance - (approvedAgg._sum.totalCost ?? 0) - (pendingAgg._sum.totalCost ?? 0)
        if (remaining < 0) throw new Error('Insufficient funds')

        return tx.request.update({
            where: { id },
            data: { status: 'approved', approvedAt: new Date() },
        })
    })

    res.json(result)
})

export default router
