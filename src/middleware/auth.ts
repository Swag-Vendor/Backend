import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface AuthedRequest extends Request {
    user?: { userId: number; role: string }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    try {
        req.user = jwt.verify(header.slice(7), JWT_SECRET) as any
        next()
    } catch {
        res.status(401).json({ error: 'Invalid token' })
    }
}

export function requireRole(role: string) {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' })
        next()
    }
}
