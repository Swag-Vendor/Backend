/*
  FLOW:
  db.ts exports the client -> route files import -> route files use
  prisma.user.create(...) etc. inside request handlers
*/

import { Router } from 'express'
import { prisma } from '../db.ts'

const router = Router()

router.post('/', async (req, res) => {
    const user = await prisma.user.create({
        data: {
            email: req.body.email,
            passwordHash: req.body.passwordHash,
            name: req.body.name,
            roleId: req.body.roleId,
        },
    })
    res.json(user)
})

router.get('/:id', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(req.params.id) },
        include: { role: true, requests: true },
    })
    res.json(user)
})

export default router
