import { Router } from 'express'
import { prisma } from '../db.ts'

const router = Router()

router.get('/', async (_req, res) => {
    const fund = await prisma.masterFund.findFirst()
    res.json(fund)
})

export default router
