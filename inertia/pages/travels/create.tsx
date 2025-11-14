// inertia/pages/travels/create.tsx
import { Head, router } from '@inertiajs/react'
import {
  ActionIcon,
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
import { LuMapPinHouse, LuMapPin, LuMapPinCheck } from 'react-icons/lu'
import UserLayout from '~/layouts/user_layout'
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
  const [insertForIndex, setInsertForIndex] = useState<number | null>(null)
  const [insertValue, setInsertValue] = useState<string | null>(null)

  // Adresses disponibles (y compris Maison)
  const allAddressesById = useMemo(() => {
    const m = new Map<number, Address>()
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

  const segKeyFromIndex = (idx: number) =>
    idx < 0 || idx >= picks.length - 1 ? null : segKey(picks[idx].id, picks[idx + 1].id)

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

  // Chargement des métriques depuis localStorage
  useEffect(() => {
    const map: Record<string, Metrics> = {}
    for (const [a, b] of segments) {
      const key = segKey(a.id, b.id)
      const lsK = lsKey(a.id, b.id)
      const cached = window.localStorage.getItem(lsK)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Metrics
          map[key] = parsed
        } catch {
          // ignore
        }
      }
    }
    setMetricsMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length])

  async function fetchMetricsForSegment(a: Pick, b: Pick) {
    const key = segKey(a.id, b.id)
    if (metricsMap[key] || resolving[key]) return

    setResolving((prev) => ({ ...prev, [key]: true }))
    try {
      const response = await fetch(`/api/metrics?start_id=${a.id}&end_id=${b.id}`)
      if (!response.ok) throw new Error('Erreur lors du calcul de la distance')
      const data = (await response.json()) as Metrics

      setMetricsMap((prev) => {
        const next = { ...prev, [key]: data }
        window.localStorage.setItem(lsKey(a.id, b.id), JSON.stringify(data))
        return next
      })
    } catch (error: any) {
      notifications.show({
        color: 'red',
        title: 'Erreur de calcul',
        message: error.message ?? 'Impossible de calculer la distance pour ce segment.',
      })
    } finally {
      setResolving((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // Recalcul des métriques lorsque des étapes changent autour d’un index
  function recalcAroundIndex(idx: number) {
    const prevKey = segKeyFromIndex(idx - 1)
    const nextKey = segKeyFromIndex(idx)

    if (prevKey) {
      const [aId, bId] = prevKey.split('-').map(Number)
      const a = { id: aId, name: allAddressesById.get(aId)?.name ?? '' }
      const b = { id: bId, name: allAddressesById.get(bId)?.name ?? '' }
      fetchMetricsForSegment(a, b)
    }
    if (nextKey) {
      const [aId, bId] = nextKey.split('-').map(Number)
      const a = { id: aId, name: allAddressesById.get(aId)?.name ?? '' }
      const b = { id: bId, name: allAddressesById.get(bId)?.name ?? '' }
      fetchMetricsForSegment(a, b)
    }
  }

  useEffect(() => {
    segments.forEach(([a, b]) => {
      fetchMetricsForSegment(a, b)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length])

  const totalDistance = useMemo(
    () => Array.from(segKeysSet).reduce((sum, k) => sum + (metricsMap[k]?.distance ?? 0), 0),
    [segKeysSet, metricsMap]
  )

  const canSave =
    date && picks.length >= 2 && Array.from(segKeysSet).every((k) => !!metricsMap[k])

  async function save() {
    if (!date) return
    const legs = []
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

  const openInsertAfter = (idx: number) => {
    setInsertForIndex(idx)
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

  return (
    <>
      <Head title="Créer un trajet" />
      <Container py="lg">
        <Grid gutter="lg">
          {/* Colonne gauche : carnet d’adresses */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="lg">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Date du trajet
                  </Text>
                  <DateInput
                    value={date}
                    onChange={setDate}
                    valueFormat="DD/MM/YYYY"
                    aria-label="Date du trajet"
                  />
                </Stack>
              </Paper>

              <AddressBook
                addresses={addresses}
                homeAddress={homeAddress ?? undefined}
                onAdd={(addr) => addPick(addr)}
              />
            </Stack>
          </Grid.Col>

          {/* Colonne droite : étapes & aperçu */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={3}>Étapes du trajet</Title>
                  <Text size="sm" c="dimmed">
                    Ajoutez au moins un point de départ et une arrivée pour construire votre trajet.
                  </Text>
                </div>

                <Box ta="right">
                  <Text size="xs" c="dimmed">
                    Distance totale estimée
                  </Text>
                  <Text fw={600}>
                    {totalDistance > 0 ? formatKm(totalDistance) : 'En attente des étapes'}
                  </Text>
                </Box>
              </Group>

              <Paper withBorder radius="lg" p="md">
                <Stack gap="sm">
                  {picks.length === 0 && (
                    <Text size="sm" c="dimmed">
                      Aucune étape pour le moment. Sélectionnez des adresses à gauche pour
                      commencer.
                    </Text>
                  )}

                  {picks.map((p, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === picks.length - 1
                    const icon = isFirst ? (
                      <LuMapPinHouse size={20} />
                    ) : isLast ? (
                      <LuMapPinCheck size={20} />
                    ) : (
                      <LuMapPin size={18} />
                    )

                    const address = allAddressesById.get(p.id)

                    // Infos sur le segment vers l’étape suivante (si elle existe)
                    const hasNext = !isLast && picks[idx + 1]
                    const nextPick = hasNext ? picks[idx + 1] : null
                    const segmentKey =
                      hasNext && nextPick ? segKey(p.id, nextPick.id) : null
                    const metrics = segmentKey ? metricsMap[segmentKey] : undefined
                    const isLoading =
                      segmentKey ? resolving[segmentKey] && !metrics : false

                    return (
                      <Stack key={`${p.id}-${idx}`} gap={4}>
                        <Transition
                          mounted
                          transition="pop"
                          duration={120}
                          timingFunction="ease-out"
                        >
                          {(styles) => (
                            <div style={styles}>
                              <Paper
                                withBorder
                                radius="md"
                                p="xs"
                                style={{
                                  background: 'rgba(15,23,42,.9)',
                                  borderColor: 'rgba(148,163,184,.4)',
                                }}
                              >
                                <Group
                                  justify="space-between"
                                  align="center"
                                  gap="md"
                                  wrap="nowrap"
                                >
                                  {/* Col 1 : icône */}
                                  <Box
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 999,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background:
                                        isFirst || isLast
                                          ? 'linear-gradient(135deg, rgba(56,189,248,.28), rgba(129,140,248,.32))'
                                          : 'rgba(15,23,42,1)',
                                      border:
                                        isFirst || isLast
                                          ? '1px solid rgba(129,140,248,.8)'
                                          : '1px solid rgba(51,65,85,.9)',
                                    }}
                                  >
                                    {icon}
                                  </Box>

                                  {/* Col 2 : nom + adresse */}
                                  <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                      fw={600}
                                      size="sm"
                                      style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {p.name}
                                    </Text>
                                    {address && (
                                      <Text
                                        size="xs"
                                        c="dimmed"
                                        style={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {address.address}, {address.postalCode}{' '}
                                        {address.city}
                                      </Text>
                                    )}
                                  </Box>

                                  {/* Col 3 : boutons monter / descendre */}
                                  <Group gap="xs">
                                    <Tooltip label="Monter" color="dark">
                                      <ActionIcon
                                        variant="subtle"
                                        aria-label="Monter"
                                        disabled={idx === 0}
                                        onClick={() => {
                                          movePickUp(idx)
                                          recalcAroundIndex(idx)
                                        }}
                                      >
                                        <TbArrowUp />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Descendre" color="dark">
                                      <ActionIcon
                                        variant="subtle"
                                        aria-label="Descendre"
                                        disabled={idx === picks.length - 1}
                                        onClick={() => {
                                          movePickDown(idx)
                                          recalcAroundIndex(idx)
                                        }}
                                      >
                                        <TbArrowDown />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>

                                  {/* Col 4 : suppression */}
                                  <Tooltip
                                    label="Supprimer l’étape"
                                    color="dark"
                                  >
                                    <ActionIcon
                                      variant="subtle"
                                      color="red"
                                      aria-label="Supprimer l’étape"
                                      onClick={() => removePick(idx)}
                                    >
                                      <TbTrash />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Paper>
                            </div>
                          )}
                        </Transition>

                        {/* Connecteur entre cette étape et la suivante */}
                        {hasNext && (
                          <Box
                            pl={40}
                            ml={8}
                            style={{
                              borderLeft: '1px dashed rgba(148,163,184,.5)',
                            }}
                          >
                            <Box
                              style={{
                                marginLeft: 8,
                                marginTop: 4,
                                marginBottom: 4,
                              }}
                            >
                              <Group gap="xs" align="center">
                                {isLoading && <Loader size="xs" />}
                                {!isLoading && metrics && (
                                  <>
                                    <Text size="xs" fw={500}>
                                      {metrics.distanceToString}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      • {metrics.durationToString}
                                    </Text>
                                  </>
                                )}
                                {!isLoading && !metrics && (
                                  <Text size="xs" c="dimmed">
                                    Calcul en cours…
                                  </Text>
                                )}
                              </Group>
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    )
                  })}
                </Stack>
              </Paper>

              {/* Ancien récapitulatif des segments (distance + durée)
                  -> remplacé par les connecteurs entre étapes pour un affichage plus visuel. */}

              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Toutes les étapes doivent être renseignées pour enregistrer le trajet.
                </Text>
                <Button
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                  disabled={!canSave}
                  onClick={save}
                >
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
            background: 'rgba(15,23,42,.98)',
          }}
        >
          <Stack gap="sm">
            <Text fw={500}>Insérer une adresse après cette étape</Text>
            <Select
              placeholder="Choisir une adresse"
              data={selectData}
              value={insertValue}
              onChange={setInsertValue}
              searchable
              nothingFoundMessage="Aucune adresse"
            />
            <Group justify="flex-end" gap="xs">
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
    </>
  )
}

Create.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Create
