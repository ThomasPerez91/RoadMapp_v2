import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Travel from '#models/travel'
import Address from '#models/address'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'

export default class Leg extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'start_id' })
  declare startId: number

  @column({ columnName: 'end_id' })
  declare endId: number

  @column({ columnName: 'travel_id' })
  declare travelId: number

  @column({ columnName: 'distance_to_string' })
  declare distanceToString: string

  @column({ columnName: 'duration_to_string' })
  declare durationToString: string

  @column()
  declare distance: number

  @column()
  declare duration: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Travel, { foreignKey: 'travelId' })
  declare travel: BelongsTo<typeof Travel>

  @belongsTo(() => Address, { foreignKey: 'startId' })
  declare startAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'endId' })
  declare endAddress: BelongsTo<typeof Address>
}
