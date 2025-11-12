import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'
import Leg from '#models/leg'
import { GoogleMetricsService, type Metrics } from '#services/google_metrics'
import { metricsQueryValidator } from '#validators/metrics'

function buildFullAddress(a: Address): string {
  const parts: string[] = []
  if (a.address) parts.push(a.address)
  if ((a as any).postalCode) parts.push((a as any).postalCode)
  if ((a as any).city) parts.push((a as any).city)
  if (parts.length === 0 && a.name) parts.push(a.name)
  return parts.join(', ')
}

export default class MetricsController {
  async show({ request, response, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const { startId, endId } = await request.validateUsing(metricsQueryValidator)

    const [start, end] = await Promise.all([
      Address.query().where('user_id', user.id).andWhere('id', startId).first(),
      Address.query().where('user_id', user.id).andWhere('id', endId).first(),
    ])
    if (!start || !end) {
      return response.forbidden({ message: 'Adresses non accessibles' })
    }

    const existing = await Leg.query()
      .where('start_id', startId)
      .andWhere('end_id', endId)
      .orderBy('id', 'desc')
      .first()

    if (existing) {
      const data: Metrics = {
        distance: existing.distance,
        duration: existing.duration,
        distanceToString:
          (existing as any).distanceToString ?? (existing as any).distance_to_string,
        durationToString:
          (existing as any).durationToString ?? (existing as any).duration_to_string,
      }
      return response.ok(data)
    }

    const origin = buildFullAddress(start)
    const destination = buildFullAddress(end)
    const data = await GoogleMetricsService.forAddresses(origin, destination)

    return response.ok(data)
  }
}
