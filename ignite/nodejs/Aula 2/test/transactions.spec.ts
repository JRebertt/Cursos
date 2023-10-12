import { it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

it('O usuario consegue criar uma nova transacao', () => {
  await request(app.server)
    .post('/transactions')
    .send({
      title: 'New transaction',
      amount: 7000,
      type: 'credit',
    })
    .expect(201)
})
