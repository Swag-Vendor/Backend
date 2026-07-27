import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import usersRouter from './routes/users.ts'
import authRouter from './routes/auth.ts'
import masterFundRouter from './routes/master-fund.ts'
import quotesRouter from './routes/quotes.ts'
import requestsRouter from './routes/requests.ts'
import swagItemsRouter from './routes/swag-items.ts'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/master-fund', masterFundRouter)
app.use('/quotes', quotesRouter)
app.use('/requests', requestsRouter)
app.use('/swag-items', swagItemsRouter)

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
})
