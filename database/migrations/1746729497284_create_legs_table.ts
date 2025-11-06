import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'legs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('start_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('addresses')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('end_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('addresses')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('travel_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('travels')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('distance_to_string').notNullable()
      table.string('duration_to_string').notNullable()
      table.integer('distance').notNullable()
      table.integer('duration').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
