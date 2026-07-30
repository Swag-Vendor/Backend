# Backend

## Routes


### Auth (`/auth`)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password, name, roleId }` | Returns `{ id, email }`. |
| POST | `/auth/login` | `{ email, password }` | Returns `{ token }`. |

### Users (`/users`)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/users` | `{ email, password, name, roleId }` | Returns `{ id, email }`. |
| GET | `/users/:id` | — | Includes `role` and `requests`. |

### Master Fund (`/master-fund`)

| Method | Path | Body | Auth | Notes |
|---|---|---|---|---|
| GET | `/master-fund` | — | — | `{ id, balance, updatedAt }` |
| PATCH | `/master-fund` | `{ amount, note }` | director | `amount` is a delta added to `balance`. |
| GET | `/master-fund/summary` | — | — | `{ fundTotal, approvedTotal, pendingTotal, remaining, usedPct }` |
| GET | `/master-fund/categories` | — | — | `[{ category, amount }]` |
| GET | `/master-fund/ledger` | — | — | `[{ date, description, type, amount, runningBalance }]` |

### Quotes (`/quotes`)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/quotes` | `{ vendorName, unitPrice, fulfillment?, swagItemId }` | |
| PATCH | `/quotes/:id/select` | — | Unselects any other quote on the same item. |

### Swag Items (`/swag-items`)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/swag-items` | `{ name, description?, category?, quantity, requestId? }` | |

### Requests (`/requests`)

| Method | Path | Body | Auth | Notes |
|---|---|---|---|---|
| POST | `/requests` | `{ userId, totalCost, itemIds: number[] }` | — | Creates with `status: "pending"`. |
| GET | `/requests` | — | — | Returns only `status: "pending"` requests. |
| POST | `/requests/:id/approve` | — | director | |

- test-director@technica.org / TestPass123!

- https://www.npmjs.com/package/jsonwebtoken
- https://www.npmjs.com/package/bcrypt
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema
- https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing
- https://www.prisma.io/docs/orm/prisma-client/queries/crud
- https://www.prisma.io/docs/orm/reference/prisma-schema-reference