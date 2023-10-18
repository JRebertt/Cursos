// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      created_at: string
      session_id?: string
    }

    meals: {
      id: string
      user_id: string
      name: string
      description: string
      created_at: string
      diet: boolean
    }
  }
}
