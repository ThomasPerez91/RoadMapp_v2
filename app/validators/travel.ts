import vine from '@vinejs/vine'

export const createTravelValidator = vine.compile(
  vine.object({
    date: vine.date(),
    distanceToString: vine.string().trim().maxLength(255),
    distance: vine.number().positive(),
  })
)

export const updateTravelValidator = vine.compile(
  vine.object({
    date: vine.date(),
    distanceToString: vine.string().trim().maxLength(255),
    distance: vine.number().positive(),
  })
)
