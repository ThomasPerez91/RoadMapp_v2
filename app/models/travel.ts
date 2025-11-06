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

  @column()
  declare user_id: number

  @column()
  declare distance_to_string: string

  @column()
  declare distance: number

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Leg)
  declare legs: HasMany<typeof Leg>
}
