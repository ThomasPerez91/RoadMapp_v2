import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Travel from '#models/travel'
import Address from '#models/address'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'

export default class Leg extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare startId: number

  @column()
  declare endId: number

  @column()
  declare travelId: number

  @column()
  declare distanceToString: string

  @column()
  declare durationToString: string

  @column()
  declare distance: number

  @column()
  declare duration: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Travel)
  declare travel: BelongsTo<typeof Travel>

  @belongsTo(() => Address, { foreignKey: 'startAddressId' })
  declare startAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'endAddressId' })
  declare endAddress: BelongsTo<typeof Address>
}
