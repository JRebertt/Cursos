import { FastifyInstance } from 'fastify'
import z from 'zod'
import { checkSessionIdExists } from '../middleware/check-session-id-exist'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoute(app: FastifyInstance) {
  app.addHook('preHandler', async () => [checkSessionIdExists])

  app.post('/', async (request, reply) => {
    const createMealsBody = z.object({
      name: z.string(),
      description: z.string(),
      diet: z.boolean(),
    })

    const { description, diet, name } = createMealsBody.parse(request.body)

    const { sessionId } = request.cookies

    const user = await knex('users')
      .where('session_id', sessionId)
      .select('id')
      .first()

    await knex('meals').insert({
      id: randomUUID(),
      name,
      user_id: user?.id,
      description,
      diet,
    })

    return reply.status(201).send()
  })

  app.get('/', async (request) => {
    const { sessionId } = request.cookies

    const userId = await knex('users').where('session_id', sessionId).first()

    const meals = await knex('meals')
      .select('*')
      .where('user_id', userId?.id)

    return { meals }
  })

  app.get('/:id', async (request) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const [userId] = await knex('users').where('session_id', sessionId)

    const meal = await knex('meals')
      .where({
        id,
        user_id: userId.id,
      })
      .first()

    return { meal }
  })

  app.delete('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const [userId] = await knex('users').where('session_id', sessionId)

    await knex('meals')
      .where({
        id,
        user_id: userId.id,
      })
      .first()
      .delete()
    return reply.status(202).send('Refeição deletada com sucesso')
  })

  app.put('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const [user] = await knex('users')
      .where('session_id', sessionId)
      .select('id')

    const editMealsBody = z.object({
      name: z.string(),
      description: z.string(),
      diet: z.boolean(),
    })

    const { description, diet, name } = editMealsBody.parse(request.body)

    await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .first()
      .update({
        name,
        description,
        diet,
      })

    return reply.status(202).send()
  })

  app.get('/summary', async (request) => {
    const { sessionId } = request.cookies

    const [user] = await knex('users')
      .where('session_id', sessionId)
      .select('id')

    const count = await knex('meals')
      .count('id', {
        as: ' total de refeições registradas',
      })
      .where('user_id', user.id)
      .first()

    const dietMeal = await knex('meals')
      .count('id', {
        as: 'total de refeições dentro da dieta',
      })
      .where({
        user_id: user.id,
        diet: true,
      })
    const noDietMeal = await knex('meals')
      .count('id', {
        as: 'total de refeições fora da dieta',
      })
      .where({
        user_id: user.id,
        diet: false,
      })
    const bestMeal = await knex('meals').orderBy('created_at', 'desc').where({
      user_id: user.id,
      diet: true,
    })

    return { count, dietMeal, noDietMeal, bestMeal }
  })
}
