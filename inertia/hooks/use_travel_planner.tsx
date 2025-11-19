// inertia/hooks/use_travel_planner.ts
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { notifications } from '@mantine/notifications'
import type { AddressBookAddress as TravelAddress } from '~/components/addresses/address_book'

export type Metrics = {
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

export type Pick = { id: number; name: string }

export type InitialLeg = {
  startId: number
  endId: number
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

export type LegInput = {
  startId: number
  endId: number
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

export type UseTravelPlannerOptions = {
  addresses: TravelAddress[]
  initialDate?: Date | null
  initialPicks?: Pick[]
  initialLegs?: InitialLeg[]
  onSave: (payload: { date: Date; legs: LegInput[] }) => Promise<void>
}

export type UseTravelPlannerResult = {
  date: Date | null
  setDate: (date: Date | null) => void
  addresses: TravelAddress[]
  allAddressesById: Map<number, TravelAddress>
  homeAddress: TravelAddress | null
  picks: Pick[]
  addPick: (address: TravelAddress, insertIndex?: number) => void
  removePick: (idx: number) => void
  movePickUp: (idx: number) => void
  movePickDown: (idx: number) => void
  segments: Array<[Pick, Pick]>
  segKey: (aId: number, bId: number) => string
  metricsMap: Record<string, Metrics>
  resolving: Record<string, boolean>
  invalidIndices: Set<number>
  hasInvalidSegments: boolean
  totalDistance: number
  canSave: boolean
  save: () => Promise<void>
  // insertion après une étape
  insertForIndex: number | null
  insertValue: string | null
  selectData: { value: string; label: string }[]
  openInsertAfter: (idx: number) => void
  closeInsertModal: () => void
  setInsertValue: (value: string | null) => void
  confirmInsertAfter: () => void
}

const lsKey = (a: number, b: number) => `metrics:${a}-${b}`
export const segKey = (a: number, b: number) => `${a}-${b}`

export function formatKm(meters: number) {
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

export default function useTravelPlanner(
  options: UseTravelPlannerOptions
): UseTravelPlannerResult {
  const { addresses, initialDate, initialPicks, initialLegs, onSave } = options

  const [date, setDate] = useState<Date | null>(initialDate ?? dayjs().toDate())
  const [picks, setPicks] = useState<Pick[]>(initialPicks ?? [])
  const [resolving, setResolving] = useState<Record<string, boolean>>({})
  const [metricsMap, setMetricsMap] = useState<Record<string, Metrics>>({})
  const [insertForIndex, setInsertForIndex] = useState<number | null>(null)
  const [insertValue, setInsertValue] = useState<string | null>(null)

  const allAddressesById = useMemo(() => {
    const m = new Map<number, TravelAddress>()
    addresses.forEach((a) => m.set(a.id, a))
    return m
  }, [addresses])

  const homeAddress = useMemo(
    () => addresses.find((a) => a.isHome) ?? null,
    [addresses]
  )

  const segments = useMemo(() => {
    const out: Array<[Pick, Pick]> = []
    for (let i = 0; i < picks.length - 1; i++) out.push([picks[i], picks[i + 1]])
    return out
  }, [picks])

  const segKeysSet = useMemo(
    () => new Set(segments.map(([a, b]) => segKey(a.id, b.id))),
    [segments]
  )

  // indices d’étapes invalides (deux étapes consécutives vers la même adresse)
  const invalidIndices = useMemo(() => {
    const indices = new Set<number>()
    for (let i = 0; i < picks.length - 1; i++) {
      if (picks[i].id === picks[i + 1].id) {
        indices.add(i + 1)
      }
    }
    return indices
  }, [picks])

  const hasInvalidSegments = invalidIndices.size > 0

  function addPick(address: TravelAddress, insertIndex?: number) {
    if (
      insertIndex === undefined &&
      picks.length > 0 &&
      picks[picks.length - 1].id === address.id
    ) {
      notifications.show({
        color: 'red',
        title: 'Étape invalide',
        message: 'Impossible de créer un segment entre deux points identiques.',
      })
      return
    }

    setPicks((prev) => {
      if (insertIndex === undefined) {
        return [...prev, { id: address.id, name: address.name }]
      }
      const next = [...prev]
      next.splice(insertIndex, 0, { id: address.id, name: address.name })
      return next
    })
  }

  function removePick(idx: number) {
    setPicks((prev) => prev.filter((_, i) => i !== idx))
  }

  function movePickUp(idx: number) {
    if (idx <= 0) return
    setPicks((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  function movePickDown(idx: number) {
    if (idx >= picks.length - 1) return
    setPicks((prev) => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  // Pré-remplissage pour l’édition (à partir des legs)
  useEffect(() => {
    if (!initialLegs || !initialLegs.length) return

    const seqIds = [initialLegs[0].startId, ...initialLegs.map((l) => l.endId)]
    setPicks(seqIds.map((id) => ({ id, name: allAddressesById.get(id)?.name ?? `#${id}` })))

    setMetricsMap((prev) => {
      const next: Record<string, Metrics> = { ...prev }
      for (const l of initialLegs) {
        const key = segKey(l.startId, l.endId)
        next[key] = {
          distance: l.distance,
          duration: l.duration,
          distanceToString: l.distanceToString,
          durationToString: l.durationToString,
        }
      }
      return next
    })
  }, [initialLegs, allAddressesById])

  // Chargement métriques depuis localStorage (TTL)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const now = Date.now()
    const map: Record<string, Metrics> = {}

    for (const [a, b] of segments) {
      const key = segKey(a.id, b.id)
      const storageKey = lsKey(a.id, b.id)
      const cached = window.localStorage.getItem(storageKey)
      if (!cached) continue

      try {
        const { ttl, data } = JSON.parse(cached) as { ttl: number; data: Metrics }
        if (ttl > now) {
          map[key] = data
        } else {
          window.localStorage.removeItem(storageKey)
        }
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    if (Object.keys(map).length > 0) {
      setMetricsMap((prev) => ({ ...prev, ...map }))
    }
  }, [segments])

  async function fetchMetricsForSegment(a: Pick, b: Pick) {
    const key = segKey(a.id, b.id)
    if (metricsMap[key] || resolving[key]) return

    const startId = a.id
    const endId = b.id
    const now = Date.now()

    setResolving((prev) => ({ ...prev, [key]: true }))

    try {
      const url = new URL('/api/metrics', window.location.origin)
      url.searchParams.set('startId', String(startId))
      url.searchParams.set('endId', String(endId))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('metrics failed')

      const data = (await res.json()) as Metrics
      setMetricsMap((prev) => ({ ...prev, [key]: data }))

      const ttl = now + 7 * 24 * 60 * 60 * 1000
      window.localStorage.setItem(lsKey(startId, endId), JSON.stringify({ ttl, data }))
    } catch (error: any) {
      notifications.show({
        color: 'red',
        title: 'Erreur métriques',
        message: error?.message ?? 'Impossible de récupérer la distance pour ce segment.',
      })
    } finally {
      setResolving((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // Résolution auto des métriques dès que les segments changent
  useEffect(() => {
    segments.forEach(([a, b]) => {
      void fetchMetricsForSegment(a, b)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments])

  const totalDistance = useMemo(
    () => Array.from(segKeysSet).reduce((sum, k) => sum + (metricsMap[k]?.distance ?? 0), 0),
    [segKeysSet, metricsMap]
  )

  const canSave =
    !!date &&
    picks.length >= 2 &&
    !hasInvalidSegments &&
    Array.from(segKeysSet).every((k) => !!metricsMap[k])

  async function save() {
    if (!date) return
    const legs: LegInput[] = []

    for (let i = 0; i < picks.length - 1; i++) {
      const a = picks[i]
      const b = picks[i + 1]
      const key = segKey(a.id, b.id)
      const m = metricsMap[key]
      if (!m) continue
      legs.push({
        startId: a.id,
        endId: b.id,
        distance: m.distance,
        duration: m.duration,
        distanceToString: m.distanceToString,
        durationToString: m.durationToString,
      })
    }

    await onSave({ date, legs })
  }

  const selectData = useMemo(
    () =>
      addresses.map((a) => ({
        value: String(a.id),
        label: a.name,
      })),
    [addresses]
  )

  const openInsertAfter = (idx: number) => {
    setInsertForIndex(idx)
    setInsertValue(null)
  }

  const closeInsertModal = () => {
    setInsertForIndex(null)
    setInsertValue(null)
  }

  const confirmInsertAfter = () => {
    if (insertForIndex === null || !insertValue) return
    const id = Number.parseInt(insertValue, 10)
    const address = addresses.find((a) => a.id === id)
    if (!address) return

    addPick(address, insertForIndex + 1)
    setInsertForIndex(null)
    setInsertValue(null)
  }

  return {
    date,
    setDate,
    addresses,
    allAddressesById,
    homeAddress,
    picks,
    addPick,
    removePick,
    movePickUp,
    movePickDown,
    segments,
    segKey,
    metricsMap,
    resolving,
    invalidIndices,
    hasInvalidSegments,
    totalDistance,
    canSave,
    save,
    insertForIndex,
    insertValue,
    selectData,
    openInsertAfter,
    closeInsertModal,
    setInsertValue,
    confirmInsertAfter,
  }
}
