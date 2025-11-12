// app/validators/user.ts
import vine from '@vinejs/vine'

export const updateUserProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    avatar_url: vine.string().trim().url().maxLength(500).optional(),
  })
)
