import vine from '@vinejs/vine'

/**
 * Validates the address creation action
 */
export const createAddressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    address: vine.string().trim().maxLength(255),
    postalCode: vine.string().trim().maxLength(255),
    city: vine.string().trim().maxLength(255),
    isHome: vine.boolean().optional(),
  })
)

/**
 * Validates the address update action
 */
export const updateAddressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    address: vine.string().trim().maxLength(255),
    postalCode: vine.string().trim().maxLength(255),
    city: vine.string().trim().maxLength(255),
    isHome: vine.boolean().optional(),
  })
)
