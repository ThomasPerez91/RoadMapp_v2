import vine from '@vinejs/vine'

/**
 * Validates the address creation action
 */
export const createAddressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    address: vine.string().trim().maxLength(255),
    postal_code: vine.string().trim().maxLength(255),
    city: vine.string().trim().maxLength(255),
    is_home: vine.boolean().optional(),
    is_active: vine.boolean().optional(),
    checked: vine.boolean().optional(),
  })
)

/**
 * Validates the address update action
 */
export const updateAddressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    address: vine.string().trim().maxLength(255),
    postal_code: vine.string().trim().maxLength(255),
    city: vine.string().trim().maxLength(255),
    is_home: vine.boolean().optional(),
    is_active: vine.boolean().optional(),
    checked: vine.boolean().optional(),
  })
)
