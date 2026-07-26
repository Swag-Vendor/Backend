/*
  FLOW:
  db.ts exports the client -> route files import -> route files use
  prisma.swagItem.create(...) etc. inside request handlers
*/

import { Router } from 'express'
import { prisma } from '../db.ts'

const router = Router()

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

export default router
