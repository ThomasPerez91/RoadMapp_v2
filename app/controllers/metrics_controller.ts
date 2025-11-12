import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'
import Leg from '#models/leg'
import { GoogleMetricsService, type Metrics } from '#services/google_metrics'
import { metricsQueryValidator } from '#validators/metrics'

type AddressWithCoordinates = Address & { lat?: number | null; lng?: number | null }

function resolveLocation(address: AddressWithCoordinates) {
  if (address.lat && address.lng) {
    return `${address.lat},${address.lng}`
  }
  return address.address
}

export default class MetricsController {

  async show({ request, response, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const { startId, endId } = await request.validateUsing(metricsQueryValidator)

    const [start, end] = await Promise.all([
      Address.query().where('userId', user.id).andWhere('id', startId).first(),
      Address.query().where('userId', user.id).andWhere('id', endId).first(),
    ])
    if (!start || !end) return response.forbidden({ message: 'Addresses not accessible' })

    const existing = await Leg.query()
      .where('start_id', startId)
      .andWhere('end_id', endId)
      .orderBy('id', 'desc')
      .first()

    if (existing) {
      const data: Metrics = {
        distance: existing.distance,
        duration: existing.duration,
        distanceToString: existing.distanceToString,
        durationToString: existing.durationToString,
      }
      return response.ok(data)
    }

    const origin = resolveLocation(start as AddressWithCoordinates)
    const destination = resolveLocation(end as AddressWithCoordinates)
    const data = await GoogleMetricsService.forAddresses(origin, destination)

    return response.ok(data)
  }
}
