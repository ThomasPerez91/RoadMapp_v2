import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import Travel from '#models/travel'
import Leg from '#models/leg'

export default class User extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number

  @column({ serializeAs: null })
  declare oauth_id: string

  @column({ serializeAs: 'oauth_provider' })
  declare oauth_provider: string

  @column({ serializeAs: 'email' })
  declare email: string

  @column({ serializeAs: null })
  declare email_verification: string

  @column({ serializeAs: 'name' })
  declare name: string

  @column({ serializeAs: 'nickname' })
  declare nickname: string

  @column({ serializeAs: 'avatarUrl' })
  declare avatar_url: string

  @column({ serializeAs: null })
  declare token: string

  @column({ serializeAs: null })
  declare token_type: string

  @column({ serializeAs: null })
  declare refresh_token: string | null

  @column({ serializeAs: null })
  declare expire_at: DateTime | null

  @column({ serializeAs: null })
  declare expire_in: number | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @hasMany(() => Address)
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Travel)
  declare travels: HasMany<typeof Travel>

  @hasMany(() => Leg, { foreignKey: 'start_address_id' })
  declare departures: HasMany<typeof Leg>

  @hasMany(() => Leg, { foreignKey: 'end_address_id' })
  declare arrivals: HasMany<typeof Leg>
}
