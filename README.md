# Backend

# TODO:
- `prisma/seed.ts`
  - 3 roles and initial MasterFund row with starting balance
- `POST /auth/signup` - hash bcrypt
- `POST /auth/login` - verify password return JWT
  - check tokens on protected routes (possiby)
- role based for middleware
  - function like requireRole('director') can attach routes
- CRUD routes
  - POST /swag-items (organizer creates)
  - POST /quotes (attach vendor quote to an item)
  - POST /requests (organizer submits)
  - GET /requests (director sees pending)
  - POST /requests/:id/approve (director approves → deducts from master fund)
  - GET /master-fund (everyone can see balance)
