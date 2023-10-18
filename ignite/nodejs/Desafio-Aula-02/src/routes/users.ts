import z from 'zod'
import { FastifyInstance } from 'fastify'

import { randomUUID } from 'node:crypto'

import { checkSessionIdExists } from '../middleware/check-session-id-exist'
import { knex } from '../database'

export async function usersRoute(app: FastifyInstance) {
  app.addHook('preHandler', async () => [checkSessionIdExists])
  app.post('/', async (req, reply) => {
    const createUserBody = z.object({
      name: z.string(),
    })

    const { name } = createUserBody.parse(req.body)

    const checkUserNameExists = await knex('users').where('name', name).first()

    if (checkUserNameExists) {
      return reply.status(400).send({
        error: 'Usuario ja existe',
      })
    }

    let { sessionId } = req.cookies

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })
}
