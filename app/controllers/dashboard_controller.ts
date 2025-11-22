// app/controllers/dashboard_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Travel from '#models/travel'
import type Address from '#models/address'

interface DashboardTravelItem {
  id: number
  dateLabel: string
  fromLabel: string
  toLabel: string
  distanceLabel: string
  durationLabel?: string
  stepsCount: number
  status?: 'completed' | 'draft' | 'cancelled'
}

interface DistancePoint {
  label: string
  distanceKm: number
}

interface DashboardChartData {
  week: DistancePoint[]
  month: DistancePoint[]
  year: DistancePoint[]
}

interface DashboardSummary {
  distanceThisMonthKm: number
  travelsThisMonth: number
  distanceThisYearKm: number
}

export default class DashboardController {
  /**
   * Page principale du tableau de bord (Inertia)
   */
  async index({ inertia, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const now = DateTime.local()
    const startOfYear = now.startOf('year')

    // On va chercher jusqu'à 4 ans en arrière pour alimenter les graphes annuels
    const startForStats = now.minus({ years: 4 }).startOf('year')

    const travelsForStats = await Travel.query()
      .where('user_id', user.id)
      .andWhere('date', '>=', startForStats.toJSDate())
      .orderBy('date', 'asc')

    // --- Résumé (cartes de stats) -------------------------------------------
    const thisMonthStart = now.startOf('month')

    const travelsThisMonth = travelsForStats.filter((travel) => {
      const d = DateTime.fromJSDate(travel.date)
      return d >= thisMonthStart && d <= now
    })

    const distanceThisMonthMeters = travelsThisMonth.reduce(
      (sum, travel) => sum + (travel.distance || 0),
      0
    )

    const travelsThisYear = travelsForStats.filter((travel) => {
      const d = DateTime.fromJSDate(travel.date)
      return d >= startOfYear && d <= now
    })

    const distanceThisYearMeters = travelsThisYear.reduce(
      (sum, travel) => sum + (travel.distance || 0),
      0
    )

    const summary: DashboardSummary = {
      distanceThisMonthKm: roundKm(distanceThisMonthMeters),
      travelsThisMonth: travelsThisMonth.length,
      distanceThisYearKm: roundKm(distanceThisYearMeters),
    }

    // --- Données pour l'histogramme -----------------------------------------
    const chart: DashboardChartData = buildChartData(travelsForStats, now)

    // --- Derniers trajets pour la timeline ----------------------------------
    const recentTravels = await buildRecentTravels(user.id)

    return inertia.render('users/dashboard', {
      summary,
      chart,
      recentTravels,
    })
  }

  /**
   * Données de stats pour une période personnalisée (JSON)
   * GET /dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async stats({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const fromStr = request.input('from')
    const toStr = request.input('to')

    if (!fromStr || !toStr) {
      return response.badRequest({ error: 'Missing from/to query params' })
    }

    const from = DateTime.fromISO(fromStr).startOf('day')
    const to = DateTime.fromISO(toStr).endOf('day')

    if (!from.isValid || !to.isValid || from > to) {
      return response.badRequest({ error: 'Invalid date range' })
    }

    const travels = await Travel.query()
      .where('user_id', user.id)
      .andWhere('date', '>=', from.toJSDate())
      .andWhere('date', '<=', to.toJSDate())
      .orderBy('date', 'asc')

    // Agrégation par jour dans la plage sélectionnée
    const dailyMap = new Map<string, number>()

    for (const travel of travels) {
      const d = DateTime.fromJSDate(travel.date)
      const label = d.setLocale('fr').toFormat('dd LLL yyyy') // ex: "04 déc. 2025"
      const prev = dailyMap.get(label) || 0
      dailyMap.set(label, prev + (travel.distance || 0) / 1000)
    }

    const data: DistancePoint[] = Array.from(dailyMap.entries()).map(([label, km]) => ({
      label,
      distanceKm: Math.round(km * 10) / 10,
    }))

    const totalKm = data.reduce((sum, point) => sum + point.distanceKm, 0)

    return response.json({ data, totalKm })
  }
}

/**
 * Convertit une distance en mètres en kilomètres arrondis à 1 décimale.
 */
function roundKm(meters: number): number {
  if (!meters) return 0
  const km = meters / 1000
  return Math.round(km * 10) / 10
}

/**
 * Construit les données "week / month / year" pour l'histogramme.
 *
 * - week  : 5 dernières semaines, ordre chronologique, semaine actuelle en dernier (Sxx)
 * - month : 12 derniers mois, ordre chronologique, mois courant en dernier (LLL yyyy)
 * - year  : une barre par année contenant des trajets, triées, année actuelle en dernier
 */
function buildChartData(travels: Travel[], now: DateTime): DashboardChartData {
  // --- SEMAINE : 5 dernières semaines ---------------------------------------

  const currentWeekStart = now.startOf('week')
  const firstWeekStart = currentWeekStart.minus({ weeks: 4 }) // 5 semaines au total
  const lastWeekEnd = currentWeekStart.endOf('week')

  const weekBuckets = new Array<number>(5).fill(0)

  for (const travel of travels) {
    const d = DateTime.fromJSDate(travel.date)
    if (d < firstWeekStart || d > lastWeekEnd) continue

    const diffWeeks = Math.floor(d.diff(firstWeekStart, 'weeks').weeks)
    if (diffWeeks >= 0 && diffWeeks < 5) {
      weekBuckets[diffWeeks] += (travel.distance || 0) / 1000
    }
  }

  const week: DistancePoint[] = weekBuckets.map((distanceKm, index) => {
    const weekStart = firstWeekStart.plus({ weeks: index })
    const label = `S${weekStart.weekNumber}`
    return {
      label,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }
  })

  // --- MOIS : 12 derniers mois ----------------------------------------------

  const currentMonthStart = now.startOf('month')
  const firstMonthStart = currentMonthStart.minus({ months: 11 }) // 12 mois
  const lastMonthEnd = currentMonthStart.endOf('month')

  const monthBuckets = new Array<number>(12).fill(0)

  for (const travel of travels) {
    const d = DateTime.fromJSDate(travel.date)
    if (d < firstMonthStart || d > lastMonthEnd) continue

    const diffMonths = Math.floor(d.diff(firstMonthStart, 'months').months)
    if (diffMonths >= 0 && diffMonths < 12) {
      monthBuckets[diffMonths] += (travel.distance || 0) / 1000
    }
  }

  const month: DistancePoint[] = monthBuckets.map((distanceKm, index) => {
    const monthStart = firstMonthStart.plus({ months: index })
    const label = monthStart.setLocale('fr').toFormat('LLL yyyy')
    return {
      label,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }
  })

  // --- ANNEE : 1 colonne par année avec des données -------------------------

  const yearMap = new Map<number, number>()

  for (const travel of travels) {
    const d = DateTime.fromJSDate(travel.date)
    const year = d.year
    const prev = yearMap.get(year) || 0
    yearMap.set(year, prev + (travel.distance || 0) / 1000)
  }

  const yearsSorted = Array.from(yearMap.keys()).sort((a, b) => a - b)

  const year: DistancePoint[] = yearsSorted.map((year) => ({
    label: year.toString(),
    distanceKm: Math.round(yearMap.get(year)! * 10) / 10,
  }))

  return { week, month, year }
}

/**
 * Récupère les X derniers trajets d'un utilisateur (avec les adresses de départ/arrivée)
 * pour alimenter la timeline du dashboard.
 */
async function buildRecentTravels(userId: number, limit = 10): Promise<DashboardTravelItem[]> {
  const travels = await Travel.query()
    .where('user_id', userId)
    .orderBy('date', 'desc')
    .limit(limit)
    .preload('legs', (legsQuery) => {
      legsQuery.orderBy('id', 'asc').preload('startAddress').preload('endAddress')
    })

  return travels.map((travel) => {
    const date = DateTime.fromJSDate(travel.date).setLocale('fr')

    const firstLeg = travel.legs[0]
    const lastLeg = travel.legs[travel.legs.length - 1] ?? firstLeg

    const fromLabel = firstLeg?.startAddress ? buildShortAddress(firstLeg.startAddress) : 'Départ'
    const toLabel = lastLeg?.endAddress ? buildShortAddress(lastLeg.endAddress) : 'Arrivée'

    // 👉 Date SANS l'heure pour l'activité récente
    const dateLabel = date.toFormat('ccc d LLL yyyy')

    const distanceLabel = travel.distanceToString || `${roundKm(travel.distance)} km`

    return {
      id: travel.id,
      dateLabel,
      fromLabel,
      toLabel,
      distanceLabel,
      stepsCount: travel.legs.length,
    }
  })
}

function buildShortAddress(a: Address): string {
  if (a.name && a.name.trim().length > 0) {
    return a.name
  }

  if ((a as any).city && (a as any).city.trim().length > 0) {
    return (a as any).city
  }

  if (a.address && a.address.trim().length > 0) {
    return a.address
  }

  return 'Adresse'
}
