import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('oauth_id').notNullable()
      table.string('email').notNullable().unique()
      table.string('email_verification').notNullable()
      table.string('name').notNullable()
      table.string('nickname').nullable()
      table.string('avatar_url').notNullable()
      table.string('token').notNullable()
      table.string('token_type').notNullable()
      table.string('refresh_token').nullable()
      table.timestamp('expire_at').nullable()
      table.integer('expire_in').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
