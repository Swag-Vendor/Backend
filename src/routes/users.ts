/*
  FLOW:
  db.ts exports the client -> route files import -> route files use
  prisma.user.create(...) etc. inside request handlers
*/

import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../db.ts'

const router = Router()

router.post('/', async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 10)
    const user = await prisma.user.create({
        data: {
            email: req.body.email,
            passwordHash,
            name: req.body.name,
            roleId: req.body.roleId,
        },
    })
    res.json({ id: user.id, email: user.email })
})

router.get('/:id', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(req.params.id) },
        include: { role: true, requests: true },
    })
    res.json(user)
})

export default router
