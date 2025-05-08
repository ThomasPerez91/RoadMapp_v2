import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import Travel from '#models/travel'

export default class User extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number

  @column({ serializeAs: null })
  declare oauthId: string

  @column({ serializeAs: 'email' })
  declare email: string

  @column({ serializeAs: null })
  declare emailVerification: string

  @column({ serializeAs: 'name' })
  declare name: string

  @column({ serializeAs: 'nickname' })
  declare nickname: string

  @column({ serializeAs: 'avatarUrl' })
  declare avatarUrl: string

  @column({ serializeAs: null })
  declare token: string

  @column({ serializeAs: null })
  declare tokenType: string

  @column({ serializeAs: null })
  declare refreshToken: string | null

  @column({ serializeAs: null })
  declare expireAt: DateTime | null

  @column({ serializeAs: null })
  declare expireIn: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Address)
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Travel)
  declare travels: HasMany<typeof Travel>
}
