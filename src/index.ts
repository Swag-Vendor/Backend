import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import usersRouter from './routes/users.ts'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.use('/users', usersRouter)

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
})
