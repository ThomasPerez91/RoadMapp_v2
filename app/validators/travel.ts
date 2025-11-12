// app/validators/travels.ts
import vine from '@vinejs/vine'

export const createTravelValidator = vine.compile(
  vine.object({
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    legs: vine.array(
      vine.object({
        startId: vine.number().positive(),
        endId: vine.number().positive(),
        distance: vine.number().min(0),
        duration: vine.number().min(0),
        distanceToString: vine.string(),
        durationToString: vine.string(),
      })
    ).minLength(1),
  })
)

export const updateTravelValidator = vine.compile(
  vine.object({
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    legs: vine.array(
      vine.object({
        startId: vine.number().positive(),
        endId: vine.number().positive(),
        distance: vine.number().min(0),
        duration: vine.number().min(0),
        distanceToString: vine.string(),
        durationToString: vine.string(),
      })
    ).minLength(1).optional(),
  })
)
