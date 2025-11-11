import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Address extends BaseModel {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'name' })
  declare name: string

  @column({ columnName: 'address' })
  declare address: string

  @column({ columnName: 'postal_code' })
  declare postalCode: string

  @column({ columnName: 'city' })
  declare city: string

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'is_home' })
  declare isHome: boolean

  @column({
    columnName: 'is_active',
    consume: (v) => Boolean(v),
    serialize: (v) => v,
  })
  declare isActive: boolean

  @column({
    columnName: 'checked',
    consume: (v) => Boolean(v),
    serialize: (v) => v,
  })
  declare checked: boolean

  @column({
    columnName: 'used',
    consume: (v) => Boolean(v),
    serialize: (v) => v,
  })
  declare used: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>
}
