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
  useDraggable,
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

type DragData = { type?: 'address' | 'pick'; id?: number; name?: string }

const lsKey = (a: number, b: number) => `metrics:${a}-${b}`
const segKey = (a: number, b: number) => `${a}-${b}`

function formatKm(meters: number) {
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

/** Élément triable pour une étape (pick) — porte l'id dnd = p.id */
function SortablePick({
  id,
  label,
  onAskDelete,
}: {
  id: number
  label: string
  onAskDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id, // id logique = pick.id
    data: { type: 'pick', id }, // infos pour onDragStart/onDragEnd
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Group justify="space-between">
        <Text>{label}</Text>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={onAskDelete}
          aria-label="Supprimer l’étape"
        >
          <TbTrash />
        </ActionIcon>
      </Group>
    </div>
  )
}

/** Bouton d’adresse draggable (garde aussi le clic pour ajouter rapidement) */
function DraggableAddress({ address, onClick }: { address: Address; onClick: () => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `address-${address.id}`,
    data: { type: 'address', id: address.id, name: address.name },
  })

  return (
    <Button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      variant="subtle"
      size="compact-md"
      onClick={onClick}
      leftSection={<TbPlus />}
      fullWidth
      aria-label={`Ajouter ${address.name}`}
    >
      {address.name}
    </Button>
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
  const [activeDrag, setActiveDrag] = useState<{ type: 'address' | 'pick'; id: number } | null>(
    null
  )

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
    return [...map.entries()]
      .filter(([, list]) => list.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  }, [addresses])
  const homeAddress = useMemo(() => addresses.find((a) => a.isHome), [addresses])

  useEffect(() => {
    if (!initialLegs.length) return
    const seq = [initialLegs[0].startId, ...initialLegs.map((l) => l.endId)]
    setPicks(seq.map((id) => ({ id, name: nameById.get(id) ?? `#${id}` })))
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

  function addPick(address: Address | { id: number; name: string }, insertIndex?: number) {
    // anti doublon consécutif
    if (
      insertIndex === undefined &&
      picks.length > 0 &&
      picks[picks.length - 1].id === address.id
    ) {
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
        message: 'Impossible de récupérer la distance pour ce segment.',
      })
    } finally {
      setResolving((r) => ({ ...r, [k]: false }))
    }
  }

  useEffect(() => {
    for (let i = 0; i < picks.length - 1; i++) {
      const a = picks[i]
      const b = picks[i + 1]
      const k = segKey(a.id, b.id)
      if (!metricsMap[k] && a.id !== b.id) void resolveOne(a.id, b.id)
    }
  }, [picks]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalDistance = useMemo(
    () => Array.from(segKeysSet).reduce((sum, k) => sum + (metricsMap[k]?.distance ?? 0), 0),
    [segKeysSet, metricsMap]
  )

  const canSave =
    !!date && picks.length >= 2 && Array.from(segKeysSet).every((k) => !!metricsMap[k])

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
    const d = e.active.data.current as DragData | undefined
    if (d?.type && d.id != null) setActiveDrag({ type: d.type, id: d.id })
  }

  function onDragEnd(e: DragEndEvent) {
    const a = e.active.data.current as DragData | undefined
    const overId = e.over?.id

    setActiveDrag(null)
    if (!a || overId == null) return

    // Réordonner des picks (overId = id d'un pick)
    if (a.type === 'pick') {
      const oldIndex = picks.findIndex((p) => p.id === a.id)
      const newIndex = picks.findIndex((p) => p.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setPicks((prev) => arrayMove(prev, oldIndex, newIndex))
      }
      return
    }

    // Déposer une adresse : insertion après le pick survolé (ou en fin de liste si drop dans le vide)
    if (a.type === 'address') {
      const afterIdx = picks.findIndex((p) => p.id === overId)
      const insertIndex = afterIdx !== -1 ? afterIdx + 1 : picks.length
      addPick({ id: a.id!, name: a.name! }, insertIndex)
    }
  }

  return (
    <>
      <Head title={`Modifier trajet #${travel.id}`} />
      <Container size="lg" py="lg">
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" radius="lg">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Title order={4}>Carnet d’adresses</Title>
                  {homeAddress && (
                    <ActionIcon
                      variant="light"
                      onClick={() => addPick(homeAddress)}
                      aria-label="Ajouter Maison"
                    >
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
                        <DraggableAddress key={a.id} address={a} onClick={() => addPick(a)} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="lg">
                <Group>
                  <Text fw={600} size="sm">
                    Date
                  </Text>
                  <DateInput
                    value={date}
                    onChange={(value) => setDate(value ? new Date(value) : null)}
                    clearable={false}
                    locale="fr"
                    valueFormat="DD/MM/YYYY"
                    popoverProps={{ withinPortal: true }}
                  />
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

                  <SortableContext
                    items={picks.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack gap="xs">
                      {picks.map((p, idx) => (
                        <Transition
                          key={p.id}
                          mounted
                          transition="pop"
                          duration={120}
                          timingFunction="ease-out"
                        >
                          {(styles) => (
                            <div style={styles}>
                              <Paper p="xs" withBorder radius="md">
                                <Group justify="space-between">
                                  <Group gap="xs">
                                    <Badge
                                      variant={
                                        idx === 0
                                          ? 'filled'
                                          : idx === picks.length - 1
                                            ? 'light'
                                            : 'outline'
                                      }
                                    >
                                      {idx === 0
                                        ? 'Départ'
                                        : idx === picks.length - 1
                                          ? 'Arrivée'
                                          : `Étape ${idx}`}
                                    </Badge>
                                    <Text>{p.name}</Text>
                                  </Group>
                                  <SortablePick
                                    id={p.id}
                                    label={p.name}
                                    onAskDelete={() => askDelete(idx)}
                                  />
                                </Group>
                              </Paper>
                            </div>
                          )}
                        </Transition>
                      ))}
                    </Stack>
                  </SortableContext>

                  <Stack mt="md" gap="xs">
                    {segments.map(([a, b], i) => {
                      const k = segKey(a.id, b.id)
                      const loading = resolving[k]
                      const m = metricsMap[k]
                      return (
                        <Transition
                          key={k}
                          mounted
                          transition="pop"
                          duration={120}
                          timingFunction="ease-out"
                        >
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
                          ? (addresses.find((a) => a.id === activeDrag.id)?.name ??
                            `#${activeDrag.id}`)
                          : (picks.find((p) => p.id === activeDrag.id)?.name ??
                            `#${activeDrag.id}`)}
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
