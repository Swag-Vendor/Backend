/*
  FLOW:
  db.ts exports the client -> route files import -> route files use
  prisma.user.create(...) etc. inside request handlers
*/

import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../db.ts'
import { requireAuth, requireRole } from '../middleware/auth.ts'

const router = Router()

// Director-only: this is how staff get accounts with an elevated role (director/exec).
// Public self-registration lives at POST /auth/signup and always creates 'organizer' accounts.
router.post('/', requireAuth, requireRole('director'), async (req, res) => {
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

router.get('/:id', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(req.params.id) },
        include: { role: true, requests: true },
        omit: { passwordHash: true },
    })
    res.json(user)
})

export default router
