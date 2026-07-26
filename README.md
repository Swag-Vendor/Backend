# Backend

# TODO:
- prisma/seed.ts (3 roles + initial MasterFund row)
- POST /auth/signup (bcrypt hash)
- POST /auth/login (JWT)
- requireRole('director') middleware

# Important
- on an protected route 
- ```router.post('/:id/approve', requireAuth, requireRole('director'), async (req, res) => { ... })```
