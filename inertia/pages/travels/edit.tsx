import { Head, router } from '@inertiajs/react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Transition,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useEffect, useMemo, useState } from 'react'
import { TbArrowRight, TbHome, TbPlus, TbTrash } from 'react-icons/tb'
import UserLayout from '~/layouts/user_layout'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Address = { id: number; name: string; isHome?: boolean }
type Leg = {
  id: number
  startId: number
  endId: number
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}
type Props = {
  travel: { id: number; date: string }
  legs: Leg[]
  addresses: Address[]
}

type Pick = { id: number; name: string }
type Metrics = {
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

const lsKey = (a: number, b: number) => `metrics:${a}-${b}`
const segKey = (a: number, b: number) => `${a}-${b}`

function formatKm(meters: number) {
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

function SortablePick({
  id,
  label,
  onAskDelete,
}: { id: number; label: string; onAskDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Group justify="space-between">
        <Text>{label}</Text>
        <ActionIcon variant="subtle" color="red" onClick={onAskDelete}>
          <TbTrash />
        </ActionIcon>
      </Group>
    </div>
  )
}

function Edit({ travel, legs: initialLegs, addresses }: Props) {
  const [date, setDate] = useState<Date | null>(new Date(travel.date))
  const [picks, setPicks] = useState<Pick[]>([])
  const [metricsMap, setMetricsMap] = useState<Record<string, Metrics>>({})
  const [resolving, setResolving] = useState<Record<string, boolean>>({})
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const [deleteOpened, setDeleteOpened] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeDrag, setActiveDrag] = useState<{ type: 'address' | 'pick'; id: number } | null>(null)

  const nameById = useMemo(() => new Map(addresses.map((a) => [a.id, a.name])), [addresses])
  const groups = useMemo(() => {
    const map = new Map<string, Address[]>()
    const sorted = [...addresses].sort((a, b) => a.name.localeCompare(b.name))
    for (const a of sorted) {
      const first = (a.name?.[0] || '#').toUpperCase()
      const key = /[A-ZÀ-ÖØ-Ý]/.test(first) ? first : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return [...map.entries()].filter(([, list]) => list.length > 0).sort(([a], [b]) => a.localeCompare(b))
  }, [addresses])
  const homeAddress = useMemo(() => addresses.find((a) => a.isHome), [addresses])

  // Hydrate picks from legs sequence
  useEffect(() => {
    if (!initialLegs.length) return
    const seq = [initialLegs[0].startId, ...initialLegs.map((l) => l.endId)]
    setPicks(seq.map((id) => ({ id, name: nameById.get(id) ?? `#${id}` })))
    // preload metricsMap from legs
    const map: Record<string, Metrics> = {}
    for (const l of initialLegs) {
      map[segKey(l.startId, l.endId)] = {
        distance: l.distance,
        duration: l.duration,
        distanceToString: l.distanceToString,
        durationToString: l.durationToString,
      }
    }
    setMetricsMap(map)
  }, [initialLegs, nameById])

  const segments = useMemo(() => {
    const out: Array<[Pick, Pick]> = []
    for (let i = 0; i < picks.length - 1; i++) out.push([picks[i], picks[i + 1]])
    return out
  }, [picks])
  const segKeysSet = useMemo(
    () => new Set(segments.map(([a, b]) => segKey(a.id, b.id))),
    [segments]
  )

  function askDelete(idx: number) {
    setDeleteIdx(idx)
    setDeleteOpened(true)
  }
  function confirmDelete() {
    if (deleteIdx === null) return
    setPicks((prev) => prev.filter((_, i) => i !== deleteIdx))
    setDeleteOpened(false)
    setDeleteIdx(null)
  }

  function addPick(address: Address, insertIndex?: number) {
    if (
      insertIndex === undefined &&
      picks.length > 0 &&
      picks[picks.length - 1].id === address.id
    ) {
      // anti doublon consécutif
      return notifications.show({
        color: 'red',
        title: 'Étape invalide',
        message: 'Impossible de créer un segment entre deux points identiques.',
      })
    }
    setPicks((prev) => {
      const next = [...prev]
      const item: Pick = { id: address.id, name: address.name }
      if (insertIndex === undefined) next.push(item)
      else next.splice(insertIndex, 0, item)
      return next
    })
  }

  // Metrics resolver (si l’utilisateur modifie la chaîne, on recalcule ce qui manque)
  async function resolveOne(startId: number, endId: number) {
    const k = segKey(startId, endId)
    if (metricsMap[k]) return
    const now = Date.now()
    const cached = localStorage.getItem(lsKey(startId, endId))
    if (cached) {
      try {
        const { ttl, data } = JSON.parse(cached) as { ttl: number; data: Metrics }
        if (ttl > now) {
          setMetricsMap((m) => ({ ...m, [k]: data }))
          return
        }
        localStorage.removeItem(lsKey(startId, endId))
      } catch {}
    }

    setResolving((r) => ({ ...r, [k]: true }))
    try {
      const url = new URL('/api/metrics', window.location.origin)
      url.searchParams.set('startId', String(startId))
      url.searchParams.set('endId', String(endId))
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('metrics failed')
      const data = (await res.json()) as Metrics
      setMetricsMap((m) => ({ ...m, [k]: data }))
      const ttl = now + 7 * 24 * 60 * 60 * 1000
      localStorage.setItem(lsKey(startId, endId), JSON.stringify({ ttl, data }))
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erreur métriques',
        message: "Impossible de récupérer la distance pour ce segment.",
      })
    } finally {
      setResolving((r) => ({ ...r, [k]: false }))
    }
  }

  useEffect(() => {
    // suite à n’importe quel changement de picks, résoudre ce qui manque
    for (let i = 0; i < picks.length - 1; i++) {
      const a = picks[i]
      const b = picks[i + 1]
      const k = segKey(a.id, b.id)
      if (!metricsMap[k] && a.id !== b.id) void resolveOne(a.id, b.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks])

  const totalDistance = useMemo(
    () =>
      Array.from(segKeysSet).reduce((sum, k) => sum + (metricsMap[k]?.distance ?? 0), 0),
    [segKeysSet, metricsMap]
  )

  const canSave =
    date &&
    picks.length >= 2 &&
    Array.from(segKeysSet).every((k) => !!metricsMap[k])

  async function save() {
    if (!date) return
    const legs = []
    for (let i = 0; i < picks.length - 1; i++) {
      const a = picks[i]
      const b = picks[i + 1]
      const m = metricsMap[segKey(a.id, b.id)]!
      legs.push({
        startId: a.id,
        endId: b.id,
        distance: m.distance,
        duration: m.duration,
        distanceToString: m.distanceToString,
        durationToString: m.durationToString,
      })
    }

    await router.put(`/api/travels/${travel.id}`, {
      date: date.toISOString().split('T')[0],
      legs,
    })
  }

  function onDragStart(e: DragStartEvent) {
    const { active } = e
    const dataset = (active?.node?.dataset ?? {}) as any
    const type = dataset.type as 'address' | 'pick' | undefined
    if (type) setActiveDrag({ type, id: Number(dataset.id) })
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveDrag(null)
    if (!over) return

    const activeType = (active?.node?.dataset as any)?.type as 'address' | 'pick' | undefined
    const overDataset = over?.data?.current as any
    const overId = (over?.id as string) || (overDataset?.id as string)

    if (activeType === 'pick' && typeof overId === 'string' && overId.startsWith('pick-')) {
      const oldIndex = picks.findIndex((p) => p.id === Number((active.node.dataset as any).id))
      const newIndex = Number(overId.split('-')[1])
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
      setPicks((prev) => arrayMove(prev, oldIndex, newIndex))
      return
    }

    if (activeType === 'address') {
      const addr = addresses.find((a) => a.id === Number((active.node.dataset as any).id))
      if (!addr) return

      if (typeof overId === 'string' && overId.startsWith('pick-')) {
        const overIndex = Number(overId.split('-')[1])
        setPicks((prev) => {
          const next = [...prev]
          next.splice(overIndex + 1, 0, { id: addr.id, name: addr.name })
          return next
        })
        return
      }

      // fallback: append
      setPicks((prev) => [...prev, { id: addr.id, name: addr.name }])
    }
  }

  return (
    <>
      <Head title={`Modifier trajet #${travel.id}`} />
      <Container size="lg" py="lg">
        <Grid gutter="md">
          {/* Carnet d'adresses */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" radius="lg">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Title order={4}>Carnet d’adresses</Title>
                  {homeAddress && (
                    <ActionIcon variant="light" onClick={() => addPick(homeAddress)} aria-label="Ajouter Maison">
                      <TbHome />
                    </ActionIcon>
                  )}
                </Group>
                <Badge variant="light">{addresses.length}</Badge>
              </Group>

              <Stack gap="xs" style={{ maxHeight: 460, overflowY: 'auto' }}>
                {Array.from(groups).map(([letter, list]) => (
                  <Box key={letter}>
                    <Divider my="xs" label={<Text fw={700}>{letter}</Text>} labelPosition="left" />
                    <Stack gap={4}>
                      {list.map((a) => (
                        <Button
                          key={a.id}
                          variant="subtle"
                          size="compact-md"
                          onClick={() => addPick(a)}
                          leftSection={<TbPlus />}
                          fullWidth
                          data-type="address"
                          data-id={a.id}
                        >
                          {a.name}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Zone principale */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="lg">
                <Group>
                  <Text fw={600} size="sm">Date</Text>
                  <DateInput value={date} onChange={setDate} clearable={false} />
                </Group>
              </Paper>

              <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <Paper withBorder p="md" radius="lg">
                  <Group justify="space-between" mb="xs">
                    <Title order={4}>Étapes</Title>
                    {segments.length > 0 && (
                      <Badge variant="dot">Total&nbsp;{formatKm(totalDistance)}</Badge>
                    )}
                  </Group>

                  <SortableContext items={picks.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <Stack gap="xs">
                      {picks.map((p, idx) => (
                        <div key={p.id} id={`pick-${idx}`} data-type="pick" data-id={p.id}>
                          <Transition mounted transition="pop" duration={120} timingFunction="ease-out">
                            {(styles) => (
                              <div style={styles}>
                                <Paper p="xs" withBorder radius="md">
                                  <Group justify="space-between">
                                    <Group gap="xs">
                                      <Badge variant={idx === 0 ? 'filled' : idx === picks.length - 1 ? 'light' : 'outline'}>
                                        {idx === 0 ? 'Départ' : idx === picks.length - 1 ? 'Arrivée' : `Étape ${idx}`}
                                      </Badge>
                                      <Text>{p.name}</Text>
                                    </Group>
                                    <SortablePick id={p.id} label={p.name} onAskDelete={() => askDelete(idx)} />
                                  </Group>
                                </Paper>
                              </div>
                            )}
                          </Transition>
                        </div>
                      ))}
                    </Stack>
                  </SortableContext>

                  {/* Segments */}
                  <Stack mt="md" gap="xs">
                    {segments.map(([a, b], i) => {
                      const k = segKey(a.id, b.id)
                      const loading = resolving[k]
                      const m = metricsMap[k]
                      return (
                        <Transition key={k} mounted transition="pop" duration={120} timingFunction="ease-out">
                          {(styles) => (
                            <div style={styles}>
                              <Paper p="sm" radius="md" withBorder>
                                <Group gap="xs" wrap="nowrap">
                                  <Text fw={600}>Segment {i + 1}</Text>
                                  <TbArrowRight />
                                  <Text>{a.name}</Text>
                                  <Text c="dimmed">→</Text>
                                  <Text>{b.name}</Text>
                                  <Box ml="auto" />
                                  {loading && <Loader size="xs" />}
                                  {!loading && m && (
                                    <Group gap="xs">
                                      <Badge variant="light">{m.distanceToString}</Badge>
                                      <Badge variant="outline">{m.durationToString}</Badge>
                                    </Group>
                                  )}
                                </Group>
                              </Paper>
                            </div>
                          )}
                        </Transition>
                      )
                    })}
                  </Stack>
                </Paper>

                <DragOverlay>
                  {activeDrag ? (
                    <Paper p="xs" radius="md" withBorder>
                      <Text size="sm">
                        {activeDrag.type === 'address'
                          ? addresses.find((a) => a.id === activeDrag.id)?.name ?? `#${activeDrag.id}`
                          : picks.find((p) => p.id === activeDrag.id)?.name ?? `#${activeDrag.id}`}
                      </Text>
                    </Paper>
                  ) : null}
                </DragOverlay>
              </DndContext>

              <Group justify="end">
                <Button disabled={!canSave} onClick={save}>
                  Enregistrer les modifications
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Modal suppression étape */}
      <ConfirmDeleteModal
        opened={deleteOpened}
        onCancel={() => setDeleteOpened(false)}
        onConfirm={confirmDelete}
        description="Supprimer cette étape du trajet ?"
      />
    </>
  )
}

Edit.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Edit
