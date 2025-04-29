import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

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
}
