import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { execSync } from 'node:child_process'
import { knex } from '../database'

describe('User Route', () => {
  beforeAll(async () => {
    await app.ready()
  })
  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  const name = 'New User'

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)
  })
  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({ name })

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        user_id: id,
        description: 'Description meal',
        diet: true,
      })
      .set('Cookie', cookie)
      .expect(201)
  })

  it('should be able to list all meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({ name })

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        user_id: id,
        description: 'Description meal',
        diet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
    expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'New Meal',
        description: 'Description meal',
      }),
    ])
  })

  it('should be able to get specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({ name })

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Description meal',
        user_id: id,
        diet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const paramsId = listMealsResponse.body.meals[0].id

    const getSpecificMeal = await request(app.server)
      .get(`/meals/${paramsId}`)
      .set('Cookie', cookie)
      .expect(200)
    expect(getSpecificMeal.body.meal).toEqual(
      expect.objectContaining({
        name: 'New Meal',
        description: 'Description meal',
      }),
    )
  })

  it('should be able to edit a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({
      name,
    })

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        user_id: id,
        diet: false,
        description: 'Description meal',
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const paramsId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${paramsId}`)
      .send({
        user_id: id,
        name: 'Update Meal',
        description: 'Updated description',
        diet: true,
      })
      .set('Cookie', cookie)
      .expect(202)
  })

  it('should be able to delete a specific', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({
      name,
    })

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'New description meal',
        user_id: id,
        diet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    console.log(listMealsResponse)

    const paramsId = listMealsResponse.body.meals[0].id

    console.log('id params', paramsId)

    await request(app.server)
      .delete(`/meals/${paramsId}`)
      .set('Cookie', cookie)
      .expect(202)
  })

  it.only('should be able to summary', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name,
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    const [id] = await knex('users').select('id').where({
      name,
    })

    await request(app.server)
      .post('/meals')
      .send({
        user_id: id,
        name: 'New meal 3',
        description: 'Drescription meal',
        diet: false,
      })
      .set('Cookie', cookies)

    await request(app.server)
      .post('/meals')
      .send({
        user_id: id,
        name: 'New meal 3',
        description: 'Drescription meal',
        diet: true,
      })
      .set('Cookie', cookies)

    await request(app.server)
      .post('/meals')
      .send({
        user_id: id,
        name: 'New meal 3',
        description: 'Drescription meal',
        diet: false,
      })
      .set('Cookie', cookies)

    const summaryResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.count).toEqual({
      'total de refeições registradas': 3,
    })

    expect(summaryResponse.body.dietMeal).toEqual([
      expect.objectContaining({
        'total de refeições dentro da dieta': 1,
      }),
    ])

    expect(summaryResponse.body.noDietMeal).toEqual([
      expect.objectContaining({
        'total de refeições fora da dieta': 2,
      }),
    ])
  })
})
