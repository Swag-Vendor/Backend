import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.ts'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET!

router.post('/signup', async (req, res) => {
    const { email, password, name, roleId } = req.body
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: { email, passwordHash, name, roleId },
    })
    res.json({ id: user.id, email: user.email })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true },
    })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
        { userId: user.id, role: user.role.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    )
    res.json({ token })
})

export default router
