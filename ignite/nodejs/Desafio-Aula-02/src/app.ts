import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { usersRoute } from './routes/users'
import { mealsRoute } from './routes/meals'

export const app = fastify()

app.register(cookie)

app.register(mealsRoute, {
  prefix: 'meals',
})

app.register(usersRoute, {
  prefix: 'users',
})
