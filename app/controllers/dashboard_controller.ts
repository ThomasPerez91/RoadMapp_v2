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
    const startForStats = now.minus({ months: 11 }).startOf('month')

    // On récupère les trajets sur les 12 derniers mois (pour alimenter les graphes)
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
 * - week  : derniers 7 jours, groupés par jour (dd/MM)
 * - month : derniers 30 jours, groupés par jour (dd/MM)
 * - year  : derniers 12 mois, groupés par mois (LLL yyyy)
 */
function buildChartData(travels: Travel[], now: DateTime): DashboardChartData {
  const weekStart = now.minus({ days: 6 }).startOf('day')
  const monthStart = now.minus({ days: 29 }).startOf('day')
  const yearStart = now.minus({ months: 11 }).startOf('month')

  const weekMap = new Map<string, number>()
  const monthMap = new Map<string, number>()
  const yearMap = new Map<string, number>()

  for (const travel of travels) {
    const d = DateTime.fromJSDate(travel.date)
    const distanceKm = (travel.distance || 0) / 1000

    if (d >= weekStart) {
      const label = d.toFormat('dd/MM')
      weekMap.set(label, (weekMap.get(label) || 0) + distanceKm)
    }

    if (d >= monthStart) {
      const label = d.toFormat('dd/MM')
      monthMap.set(label, (monthMap.get(label) || 0) + distanceKm)
    }

    if (d >= yearStart) {
      const label = d.toFormat('LLL yyyy')
      yearMap.set(label, (yearMap.get(label) || 0) + distanceKm)
    }
  }

  const mapToPoints = (source: Map<string, number>): DistancePoint[] =>
    Array.from(source.entries()).map(([label, distanceKm]) => ({
      label,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }))

  return {
    week: mapToPoints(weekMap),
    month: mapToPoints(monthMap),
    year: mapToPoints(yearMap),
  }
}

/**
 * Récupère les X derniers trajets d'un utilisateur (avec les adresses de départ/arrivée)
 * pour alimenter la timeline du dashboard.
 */
async function buildRecentTravels(
  userId: number,
  limit = 10
): Promise<DashboardTravelItem[]> {
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

    const fromLabel = firstLeg?.startAddress
      ? buildShortAddress(firstLeg.startAddress)
      : 'Départ'

    const toLabel = lastLeg?.endAddress ? buildShortAddress(lastLeg.endAddress) : 'Arrivée'

    const dateLabel = date.toFormat("ccc d LLL yyyy '·' HH:mm")

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

/**
 * Construit un libellé court pour une adresse (nom + ville / CP).
 */
function buildShortAddress(a: Address): string {
  const parts: string[] = []

  if (a.name) {
    parts.push(a.name)
  }

  const locationParts: string[] = []
  if ((a as any).postalCode) locationParts.push((a as any).postalCode)
  if ((a as any).city) locationParts.push((a as any).city)

  if (locationParts.length) {
    parts.push(locationParts.join(' '))
  }

  if (parts.length === 0 && a.address) {
    parts.push(a.address)
  }

  return parts.join(' · ')
}
