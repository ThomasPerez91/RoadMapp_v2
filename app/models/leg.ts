import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Travel from '#models/travel'
import Address from '#models/address'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'

export default class Leg extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare start_id: number

  @column()
  declare end_id: number

  @column()
  declare travel_id: number

  @column()
  declare distance_to_string: string

  @column()
  declare duration_to_string: string

  @column()
  declare distance: number

  @column()
  declare duration: number

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Travel)
  declare travel: BelongsTo<typeof Travel>

  @belongsTo(() => Address, { foreignKey: 'start_address_id' })
  declare start_address: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'end_address_id' })
  declare end_address: BelongsTo<typeof Address>
}
