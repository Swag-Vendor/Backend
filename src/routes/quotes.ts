/*
  FLOW:
  db.ts exports the client -> route files import -> route files use
  prisma.swagItem.create(...) etc. inside request handlers
*/

import { Router } from 'express'
import { prisma } from '../db.ts'
import { requireAuth } from '../middleware/auth.ts'

const router = Router()

router.use(requireAuth)

router.get('/', async (_req, res) => {
    const quotes = await prisma.quote.findMany({
        include: { swagItem: true },
        orderBy: { createdAt: 'desc' },
    })
    res.json(quotes)
})

router.post('/', async (req, res) => {
    const quote = await prisma.quote.create({
       data: {
            vendorName: req.body.vendorName,
            unitPrice: req.body.unitPrice,
            fulfillment: req.body.fulfillment,
            swagItemId: req.body.swagItemId,
        },
    })
    res.json(quote)
})

// Marks this quote as the chosen one for its item, unselecting any other
// quote on the same item. Needed so /master-fund/categories has a price to
// attribute to each item.
router.patch('/:id/select', async (req, res) => {
    const id = Number(req.params.id)
    const quote = await prisma.quote.findUnique({ where: { id } })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const [, updated] = await prisma.$transaction([
        prisma.quote.updateMany({
            where: { swagItemId: quote.swagItemId },
            data: { isSelected: false },
        }),
        prisma.quote.update({ where: { id }, data: { isSelected: true } }),
    ])
    res.json(updated)
})

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id)
    const quote = await prisma.quote.findUnique({ where: { id } })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    await prisma.quote.delete({ where: { id } })
    res.status(204).send()
})

export default router
