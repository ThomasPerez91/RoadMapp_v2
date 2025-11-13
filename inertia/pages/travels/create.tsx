// inertia/pages/travels/create.tsx
import { Head, router } from '@inertiajs/react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  Transition,
  Tooltip,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { TbArrowDown, TbArrowUp, TbPlus, TbTrash } from 'react-icons/tb'
import UserLayout from '~/layouts/user_layout'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import {
  AddressBook,
  type AddressBookAddress as Address,
} from '~/components/addresses/address_book'

type Metrics = {
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}
type Props = { addresses: Address[] }
type Pick = { id: number; name: string }

const lsKey = (a: number, b: number) => `metrics:${a}-${b}`
const segKey = (a: number, b: number) => `${a}-${b}`

function formatKm(meters: number) {
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`
}

function Create({ addresses }: Props) {
  const [date, setDate] = useState<Date | null>(dayjs().toDate())
  const [picks, setPicks] = useState<Pick[]>([])
  const [resolving, setResolving] = useState<Record<string, boolean>>({})
  const [metricsMap, setMetricsMap] = useState<Record<string, Metrics>>({})
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const [deleteOpened, setDeleteOpened] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [insertForIndex, setInsertForIndex] = useState<number | null>(null)
  const [insertValue, setInsertValue] = useState<string | null>(null)

  // Adresses disponibles (y compris Maison)
  const allAddressesById = useMemo(() => {
    const m = new Map<number, Address>()
    addresses.forEach((a) => m.set(a.id, a))
    return m
  }, [addresses])

  const segments = useMemo(() => {
    const out: Array<[Pick, Pick]> = []
    for (let i = 0; i < picks.length - 1; i++) out.push([picks[i], picks[i + 1]])
    return out
  }, [picks])

  const segKeysSet = useMemo(
    () => new Set(segments.map(([a, b]) => segKey(a.id, b.id))),
    [segments]
  )

  const segKeyFromIndex = (idx: number) =>
    idx < 0 || idx >= picks.length - 1 ? null : segKey(picks[idx].id, picks[idx + 1].id)

  function askDelete(idx: number) {
    setDeleteIdx(idx)
    setDeleteOpened(true)
  }
  function confirmDelete() {
    if (deleteIdx === null) return
    setDeleteLoading(true)
    try {
      setPicks((prev) => prev.filter((_, i) => i !== deleteIdx))
    } finally {
      setDeleteLoading(false)
      setDeleteOpened(false)
      setDeleteIdx(null)
    }
  }

  function addPick(address: Address, insertIndex?: number) {
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
      const next = [...prev]
      const item: Pick = { id: address.id, name: address.name }
      insertIndex === undefined ? next.push(item) : next.splice(insertIndex, 0, item)
      return next
    })
  }

  function movePickUp(idx: number) {
    if (idx <= 0) return
    setPicks((prev) => {
      const next = [...prev]
      const tmp = next[idx - 1]
      next[idx - 1] = next[idx]
      next[idx] = tmp
      return next
    })
  }
  function movePickDown(idx: number) {
    if (idx >= picks.length - 1) return
    setPicks((prev) => {
      const next = [...prev]
      const tmp = next[idx + 1]
      next[idx + 1] = next[idx]
      next[idx] = tmp
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

  function resolveMissingSegments() {
    for (let i = 0; i < picks.length - 1; i++) {
      const a = picks[i]
      const b = picks[i + 1]
      const k = segKey(a.id, b.id)
      if (!metricsMap[k] && a.id !== b.id) {
        void resolveOne(a.id, b.id)
      }
    }
  }

  function recalcAroundIndex(i: number) {
    const around = [i - 1, i].map(segKeyFromIndex).filter(Boolean) as string[]
    for (const k of around) {
      const [aStr, bStr] = k.split('-')
      const a = Number(aStr)
      const b = Number(bStr)
      if (a !== b) void resolveOne(a, b)
    }
  }

  useEffect(() => {
    if (picks.length >= 2) resolveMissingSegments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks])

  const totalDistance = useMemo(
    () => Array.from(segKeysSet).reduce((sum, k) => sum + (metricsMap[k]?.distance ?? 0), 0),
    [segKeysSet, metricsMap]
  )

  const canSave = date && picks.length >= 2 && Array.from(segKeysSet).every((k) => !!metricsMap[k])

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

    await router.post('/api/travels', {
      date: dayjs(date).format('YYYY-MM-DD'),
      legs,
    })
  }

  // --- Insertion via Select ---
  const selectData = useMemo(
    () =>
      addresses.map((a) => ({
        value: String(a.id),
        label: a.name,
      })),
    [addresses]
  )

  function openInsertAfter(idx: number) {
    setInsertForIndex(idx)
    setInsertValue(null)
  }
  function confirmInsertAfter() {
    if (insertForIndex === null || !insertValue) return
    const addr = allAddressesById.get(Number(insertValue))
    if (!addr) return
    addPick(addr, insertForIndex + 1)
    recalcAroundIndex(insertForIndex)
    setInsertForIndex(null)
    setInsertValue(null)
  }

  return (
    <>
      <Head title="Créer un trajet" />
      <Container size="lg" py="lg">
        <Grid gutter="md">
          {/* Carnet d’adresses (nom + tooltip) */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <AddressBook
              addresses={addresses}
              homeAddress={addresses.find((a) => a.isHome) ?? undefined}
              onAdd={(addr) => addPick(addr)}
            />
          </Grid.Col>

          {/* Zone principale */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="lg">
                <Group>
                  <Text fw={600} size="sm">
                    Date
                  </Text>
                  <DateInput
                    value={date}
                    onChange={(value: string | null) => setDate(value ? new Date(value) : null)}
                    clearable={false}
                    locale="fr"
                    valueFormat="DD/MM/YYYY"
                    popoverProps={{ withinPortal: true }}
                  />
                </Group>
              </Paper>

              <Paper withBorder p="md" radius="lg">
                <Group justify="space-between" mb="xs">
                  <Title order={4}>Étapes</Title>
                  {segments.length > 0 && (
                    <Badge variant="dot">
                      Total&nbsp;{totalDistance ? formatKm(totalDistance) : '–'}
                    </Badge>
                  )}
                </Group>

                <Stack gap="xs">
                  {picks.map((p, idx) => (
                    <Transition
                      key={`${p.id}-${idx}`}
                      mounted
                      transition="pop"
                      duration={120}
                      timingFunction="ease-out"
                    >
                      {(styles) => (
                        <div style={styles}>
                          <Paper p="xs" withBorder radius="md">
                            <Group justify="space-between" align="center">
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

                              <Group gap="xs">
                                <Tooltip label="Monter">
                                  <ActionIcon
                                    variant="subtle"
                                    onClick={() => {
                                      movePickUp(idx)
                                      recalcAroundIndex(idx - 1)
                                    }}
                                    disabled={idx === 0}
                                    aria-label="Monter"
                                  >
                                    <TbArrowUp />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Descendre">
                                  <ActionIcon
                                    variant="subtle"
                                    onClick={() => {
                                      movePickDown(idx)
                                      recalcAroundIndex(idx)
                                    }}
                                    disabled={idx === picks.length - 1}
                                    aria-label="Descendre"
                                  >
                                    <TbArrowDown />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Insérer une adresse après">
                                  <ActionIcon
                                    variant="light"
                                    onClick={() => openInsertAfter(idx)}
                                    aria-label="Insérer après"
                                  >
                                    <TbPlus />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Supprimer l’étape">
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={() => askDelete(idx)}
                                    aria-label="Supprimer"
                                  >
                                    <TbTrash />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Group>
                          </Paper>
                        </div>
                      )}
                    </Transition>
                  ))}
                </Stack>

                {/* Segments */}
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

              <Group justify="end">
                <Button disabled={!canSave} onClick={save}>
                  Enregistrer le trajet
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Insertion après — Select compact */}
      {insertForIndex !== null && (
        <Paper
          withBorder
          radius="lg"
          p="md"
          style={{
            position: 'fixed',
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            width: 420,
            maxWidth: 'calc(100% - 2rem)',
            background: 'var(--mantine-color-body)',
          }}
        >
          <Stack>
            <Title order={5}>Insérer une adresse après cette étape</Title>
            <Select
              data={selectData}
              searchable
              nothingFoundMessage="Aucune adresse"
              value={insertValue}
              onChange={setInsertValue}
              placeholder="Rechercher…"
            />
            <Group justify="end">
              <Button
                variant="default"
                onClick={() => {
                  setInsertForIndex(null)
                  setInsertValue(null)
                }}
              >
                Annuler
              </Button>
              <Button leftSection={<TbPlus />} onClick={confirmInsertAfter} disabled={!insertValue}>
                Insérer
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Modal suppression étape */}
      <ConfirmDeleteModal
        opened={deleteOpened}
        loading={deleteLoading}
        onCancel={() => setDeleteOpened(false)}
        onConfirm={confirmDelete}
        description="Supprimer cette étape du trajet ?"
      />
    </>
  )
}

Create.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Create
