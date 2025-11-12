import type { HttpContext } from '@adonisjs/core/http'
import Travel from '#models/travel'
import Leg from '#models/leg'
import Address from '#models/address'
import { travelToDto } from '#dtos/travel'
import { createTravelValidator, updateTravelValidator } from '#validators/travel'
import type { LegDto } from '#dtos/leg'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

function formatKm(meters: number) {
  if (meters === 0) {
    return '0 km'
  }

  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

type LegPayload = Omit<LegDto, 'id'>

type LegBatch = {
  records: Array<{
    travelId: number
    startId: number
    endId: number
    distance: number
    duration: number
    distanceToString: string
    durationToString: string
  }>
  totalDistance: number
  addressIds: Set<number>
}

function buildLegBatch(travelId: number, legs: LegPayload[]): LegBatch {
  const batch: LegBatch = {
    records: [],
    totalDistance: 0,
    addressIds: new Set<number>(),
  }

  for (const leg of legs) {
    batch.totalDistance += leg.distance
    batch.addressIds.add(leg.startId)
    batch.addressIds.add(leg.endId)
    batch.records.push({
      travelId,
      startId: leg.startId,
      endId: leg.endId,
      distance: leg.distance,
      duration: leg.duration,
      distanceToString: leg.distanceToString,
      durationToString: leg.durationToString,
    })
  }

  return batch
}

async function markAddressesAsUsed(addressIds: Iterable<number>, client?: TransactionClientContract) {
  const ids = Array.from(new Set(addressIds))
  if (!ids.length) return
  const query = client ? Address.query({ client }) : Address.query()
  await query.whereIn('id', ids).andWhere('used', false).update({ used: true })
}

async function recomputeAddressesUsed(addressIds: Iterable<number>, client?: TransactionClientContract) {
  const ids = Array.from(new Set(addressIds))
  if (!ids.length) return

  const legQuery = client ? Leg.query({ client }) : Leg.query()
  const legs = await legQuery
    .where((builder) => {
      builder.whereIn('start_id', ids).orWhereIn('end_id', ids)
    })

  const idsSet = new Set(ids)
  const usedIds = new Set<number>()

  for (const leg of legs) {
    if (idsSet.has(leg.startId)) usedIds.add(leg.startId)
    if (idsSet.has(leg.endId)) usedIds.add(leg.endId)
  }

  const addressQuery = client ? Address.query({ client }) : Address.query()
  await addressQuery.whereIn('id', ids).update({ used: false })

  if (usedIds.size) {
    const reactivationQuery = client ? Address.query({ client }) : Address.query()
    await reactivationQuery.whereIn('id', Array.from(usedIds)).update({ used: true })
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

    const serialized = pagination.serialize()
    const items = (serialized.data as Travel[]).map(travelToDto)

    return inertia.render('travels/index', {
      travels: items,
      meta: {
        total: serialized.meta.total,
        perPage: serialized.meta.perPage,
        currentPage: serialized.meta.currentPage,
        lastPage: serialized.meta.lastPage,
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
      picksIds.push(travel.legs[0].startId)
      for (const lg of travel.legs) picksIds.push(lg.endId)
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
        userId: user.id,
        date: new Date(payload.date),
        distance: 0,
        distanceToString: '0 km',
      }, { client: trx })

      travel.useTransaction(trx)

      const { records, totalDistance, addressIds } = buildLegBatch(travel.id, payload.legs as LegPayload[])

      if (records.length) {
        await Leg.createMany(records, { client: trx })
      }

      travel.distance = totalDistance
      travel.distanceToString = formatKm(totalDistance)
      await travel.save()

      await markAddressesAsUsed(addressIds, trx)

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

      travel.useTransaction(trx)

      const oldLegs = await Leg.query({ client: trx })
        .where('travel_id', travel.id)

      const oldAddressIds = new Set<number>()
      for (const l of oldLegs) {
        oldAddressIds.add(l.startId)
        oldAddressIds.add(l.endId)
      }

      if (payload.date) {
        travel.date = new Date(payload.date)
      }

      let total = travel.distance ?? 0

      if (payload.legs?.length) {
        await Leg.query({ client: trx }).where('travel_id', travel.id).delete()

        const { records, totalDistance, addressIds } = buildLegBatch(travel.id, payload.legs as LegPayload[])

        if (records.length) {
          await Leg.createMany(records, { client: trx })
        }

        total = totalDistance

        await markAddressesAsUsed(addressIds, trx)

        const removedAddressIds = Array.from(oldAddressIds).filter((id) => !addressIds.has(id))
        await recomputeAddressesUsed(removedAddressIds, trx)
      }

      travel.distance = total
      travel.distanceToString = formatKm(total)
      await travel.save()

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
        affectedAddressIds.add(l.startId)
        affectedAddressIds.add(l.endId)
      }

      const deleted = await Travel.query({ client: trx })
        .where('id', params.id)
        .andWhere('user_id', user.id)
        .delete()

      if (!deleted) {
        await trx.rollback()
        return response.notFound()
      }

      await recomputeAddressesUsed(affectedAddressIds, trx)

      await trx.commit()
      return response.ok({ success: true })
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }
}
