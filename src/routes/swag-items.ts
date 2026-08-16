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

router.post('/', async (req, res) => {
    const item = await prisma.swagItem.create({
        data: {
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            quantity: req.body.quantity,
            requestId: req.body.requestId,
        },
    })
    res.json(item)
})

export default router
