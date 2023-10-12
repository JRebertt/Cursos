import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { string, z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function transactionaRoute(app: FastifyInstance) {
  app.addHook('preHandler', async () => [checkSessionIdExists])
  app.get('/', async (req) => {
    const { sessionId } = req.cookies
    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select()

    return { transactions }
  })

  app.get('/:id', async (req) => {
    const getTransactionParamsSchema = z.object({
      id: string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(req.params)

    const { sessionId } = req.cookies

    const transaction = await knex('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return { transaction }
  })

  app.get('/summary', async (req) => {
    const { sessionId } = req.cookies
    const summary = await knex('transactions')
      .where('session_id', sessionId)
      .sum('amount', {
        as: 'amount',
      })
      .first()

    return { summary }
  })

  app.post('/', async (req, reply) => {
    const createTransactionBody = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBody.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
