import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionaRoute } from './routes/transactions'

export const app = fastify()

app.register(cookie)

app.register(transactionaRoute, {
  prefix: 'transactions',
})
