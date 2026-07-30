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
