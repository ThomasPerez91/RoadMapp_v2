import type { HttpContext } from '@adonisjs/core/http'
import Travel from '#models/travel'
import Leg from '#models/leg'
import Address from '#models/address'
import { travelToDto } from '#dtos/travel'
import { createTravelValidator, updateTravelValidator } from '#validators/travels'
import type { LegDto } from '#dtos/leg'
import { db } from '@adonisjs/lucid/services'

function formatKm(meters: number) {
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

type LegPayload = Omit<LegDto, 'id'>

async function markAddressesUsed(addressIds: number[], used: boolean) {
  if (addressIds.length === 0) return
  await Address.query().whereIn('id', addressIds).update({ used })
}

async function recomputeAddressesUsed(addressIds: number[]) {
  if (addressIds.length === 0) return
  for (const id of addressIds) {
    const exists = await Leg.query()
      .where('start_id', id)
      .orWhere('end_id', id)
      .first()
    await Address.query().where('id', id).update({ used: !!exists })
  }
}

export default class TravelsController {
  async index({ inertia, auth, request }: HttpContext) {
    await auth.check()
    const user = auth.user!
    const page = Number(request.input('page') || 1)
    const perPage = 25

    const pagination = await Travel.query()
      .where('user_id', user.id)
      .orderBy('date', 'desc')
      .paginate(page, perPage)

    const json = pagination.toJSON()
    const items = (json.data as Travel[]).map(travelToDto)

    return inertia.render('travels/index', {
      travels: items,
      meta: {
        total: json.total,
        perPage: json.perPage,
        currentPage: json.currentPage,
        lastPage: json.lastPage,
      },
    })
  }

  async create({ inertia, auth }: HttpContext) {
    await auth.check()
    const addresses = await Address.query()
      .where('user_id', auth.user!.id)
      .orderBy('name', 'asc')
    return inertia.render('travels/create', { addresses })
  }

  async edit({ inertia, auth, params, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    const travel = await Travel.query()
      .where('user_id', user.id)
      .andWhere('id', params.id)
      .preload('legs', (q) => q.orderBy('id', 'asc'))
      .first()
    if (!travel) return response.notFound()

    const addresses = await Address.query()
      .where('user_id', user.id)
      .orderBy('name', 'asc')

    const picksIds: number[] = []
    if (travel.legs.length > 0) {
      picksIds.push(travel.legs[0].start_id)
      for (const lg of travel.legs) picksIds.push(lg.end_id)
    }

    return inertia.render('travels/edit', {
      travel: {
        id: travel.id,
        date: travel.date.toISOString().split('T')[0],
      },
      picksIds,
      addresses,
    })
  }

  async store({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    const payload = await request.validateUsing(createTravelValidator)

    const trx = await db.transaction()
    try {
      const travel = await Travel.create({
        user_id: user.id,
        date: new Date(payload.date),
        distance: 0,
        distance_to_string: '0 km',
      }, { client: trx })

      let total = 0
      const involvedAddressIds = new Set<number>()

      for (const leg of payload.legs as LegPayload[]) {
        await Leg.create({
          travel_id: travel.id,
          start_id: leg.startId,
          end_id: leg.endId,
          distance: leg.distance,
          duration: leg.duration,
          distance_to_string: leg.distanceToString,
          duration_to_string: leg.durationToString,
        }, { client: trx })
        total += leg.distance
        involvedAddressIds.add(leg.startId)
        involvedAddressIds.add(leg.endId)
      }

      travel.distance = total
      travel.distance_to_string = formatKm(total)
      await travel.save({ client: trx })

      await Address.query({ client: trx })
        .whereIn('id', Array.from(involvedAddressIds))
        .andWhere('used', false)
        .update({ used: true })

      await trx.commit()
      return response.created({ id: travel.id })
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  async update({ request, auth, params, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    const payload = await request.validateUsing(updateTravelValidator)

    const trx = await db.transaction()
    try {
      const travel = await Travel.query({ client: trx })
        .where('user_id', user.id)
        .andWhere('id', params.id)
        .first()

      if (!travel) {
        await trx.rollback()
        return response.notFound()
      }

      const oldLegs = await Leg.query({ client: trx })
        .where('travel_id', travel.id)

      const oldAddressIds = new Set<number>()
      for (const l of oldLegs) {
        oldAddressIds.add(l.start_id)
        oldAddressIds.add(l.end_id)
      }

      if (payload.date) {
        travel.date = new Date(payload.date)
      }

      let total = travel.distance ?? 0

      if (payload.legs?.length) {
        await Leg.query({ client: trx }).where('travel_id', travel.id).delete()

        total = 0
        const newAddressIds = new Set<number>()

        for (const leg of payload.legs as LegPayload[]) {
          await Leg.create({
            travel_id: travel.id,
            start_id: leg.startId,
            end_id: leg.endId,
            distance: leg.distance,
            duration: leg.duration,
            distance_to_string: leg.distanceToString,
            duration_to_string: leg.durationToString,
          }, { client: trx })
          total += leg.distance
          newAddressIds.add(leg.startId)
          newAddressIds.add(leg.endId)
        }

        await Address.query({ client: trx })
          .whereIn('id', Array.from(newAddressIds))
          .andWhere('used', false)
          .update({ used: true })

        const potentiallyUnused = Array.from(new Set([...oldAddressIds].filter(x => !newAddressIds.has(x))))
        await recomputeAddressesUsed(potentiallyUnused)
      }

      travel.distance = total
      travel.distance_to_string = formatKm(total)
      await travel.save({ client: trx })

      await trx.commit()
      return response.ok({ id: travel.id })
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  async destroy({ auth, params, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const trx = await db.transaction()
    try {
      const legs = await Leg.query({ client: trx })
        .where('travel_id', params.id)
        .join('travels', 'travels.id', 'legs.travel_id')
        .where('travels.user_id', user.id)
        .select('legs.*')

      const affectedAddressIds = new Set<number>()
      for (const l of legs) {
        affectedAddressIds.add(l.start_id)
        affectedAddressIds.add(l.end_id)
      }

      const deleted = await Travel.query({ client: trx })
        .where('id', params.id)
        .andWhere('user_id', user.id)
        .delete()

      if (!deleted) {
        await trx.rollback()
        return response.notFound()
      }

      await recomputeAddressesUsed(Array.from(affectedAddressIds))

      await trx.commit()
      return response.ok({ success: true })
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }
}
