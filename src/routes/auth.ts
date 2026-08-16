import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db.ts'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET!

// Both endpoints hand out either a session or a new account, so both get throttled
// per-IP to make brute-forcing a password or spamming account creation impractical.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
})

// Public self-registration always creates a low-privilege 'organizer' account.
// Elevated roles (director/exec) are only assignable via POST /users by an
// existing director, so a signup request can't hand itself admin access.
router.post('/signup', authLimiter, async (req, res) => {
    const { email, password, name } = req.body
    const organizerRole = await prisma.role.findUnique({ where: { name: 'organizer' } })
    if (!organizerRole) return res.status(500).json({ error: 'organizer role not seeded' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: { email, passwordHash, name, roleId: organizerRole.id },
    })
    res.json({ id: user.id, email: user.email })
})

router.post('/login', authLimiter, async (req, res) => {
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
