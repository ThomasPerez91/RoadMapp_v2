import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'legs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('startId')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('addresses')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('endId')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('addresses')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('travelId')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('travels')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('distanceToString').notNullable()
      table.string('durationToString').notNullable()
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
