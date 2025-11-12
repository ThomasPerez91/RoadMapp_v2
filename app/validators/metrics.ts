import vine from '@vinejs/vine'

export const metricsQueryValidator = vine.compile(
  vine.object({
    startId: vine.number().positive(),
    endId: vine.number().positive(),
  })
)
