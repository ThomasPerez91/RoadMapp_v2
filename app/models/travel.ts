import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Leg from '#models/leg'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'

export default class Travel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare date: Date

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'distance_to_string' })
  declare distanceToString: string

  @column()
  declare distance: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Leg)
  declare legs: HasMany<typeof Leg>
}
