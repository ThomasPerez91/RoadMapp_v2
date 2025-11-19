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
  Modal,
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
import { Fragment, useEffect, useMemo, useState } from 'react'
import { TbArrowDown, TbArrowUp, TbPlus, TbTrash, TbX } from 'react-icons/tb'
import { LuMapPinHouse, LuMapPin, LuMapPinCheck, LuMapPinX } from 'react-icons/lu'
import UserLayout from '~/layouts/user_layout'
import {
  AddressBook,
  type AddressBookAddress as Address,
} from '~/components/addresses/address_book'
import { jsonFetch } from '~/services/http'

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

  const homeAddress = useMemo(() => addresses.find((a) => a.isHome) ?? null, [addresses])

  const segments = useMemo(() => {
    const out: Array<[Pick, Pick]> = []
    for (let i = 0; i < picks.length - 1; i++) out.push([picks[i], picks[i + 1]])
    return out
  }, [picks])

  const segKeysSet = useMemo(
    () => new Set(segments.map(([a, b]) => segKey(a.id, b.id))),
    [segments]
  )

  // 🔴 Indices d'étapes invalides (toId == fromId précédent)
  // On marque l'index de la DEUXIÈME étape du doublon consécutif
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

  // Chargement des métriques depuis localStorage (avec TTL)
  // -> dépend maintenant de `segments` complet, pas juste de sa longueur
  useEffect(() => {
    const map: Record<string, Metrics> = {}
    const now = Date.now()

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

    setMetricsMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Résolution des métriques à chaque changement de segments (ajout, suppression, réordonnancement)
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

  // 🔒 Bouton désactivé si segments invalides
  const canSave =
    !!date &&
    picks.length >= 2 &&
    !hasInvalidSegments &&
    Array.from(segKeysSet).every((k) => !!metricsMap[k])

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

    await jsonFetch('/api/travels', {
      method: 'POST',
      payload: {
        date: dayjs(date).format('YYYY-MM-DD'),
        legs,
      },
      parseResponse: false,
    })

    router.visit('/travels')
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
                  <Text size="sm">Date du trajet</Text>
                  <DateInput
                    value={date}
                    onChange={(value) => setDate(value ? new Date(value) : null)}
                    valueFormat="DD/MM/YYYY"
                    aria-label="Date du trajet"
                    popoverProps={{
                      withinPortal: true,
                      shadow: 'xl',
                      radius: 'lg',
                      styles: {
                        dropdown: {
                          background:
                            'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
                          border: '1px solid rgba(148,163,184,.45)',
                        },
                      },
                    }}
                    styles={{
                      input: {
                        background: 'rgba(15,23,42,.9)',
                        borderColor: 'rgba(56,189,248,.6)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        color: '#e5e7eb',
                      },
                      day: {
                        '&[dataSelected]': {
                          background:
                            'linear-gradient(135deg, rgba(56,189,248,.8), rgba(129,140,248,.9))',
                          color: 'white',
                        },
                        '&[dataInRange]': {
                          background: 'rgba(56,189,248,.15)',
                        },
                        '&[dataWeekend]': {
                          color: '#f97373',
                        },
                      },
                      weekday: {
                        color: '#9ca3af',
                        fontWeight: 500,
                      },
                      month: {
                        color: '#e5e7eb',
                        fontWeight: 600,
                      },
                    }}
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
              <Group justify="space-between" align="center">
                <Box>
                  <Title order={3}>Étapes du trajet</Title>
                </Box>

                <Box ta="center">
                  <Text size="xs" c="dimmed">
                    Distance totale estimée
                  </Text>
                  <Text fw={600}>
                    {totalDistance > 0 ? formatKm(totalDistance) : 'En attente des étapes'}
                  </Text>
                </Box>

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

                    const isInvalidTo = invalidIndices.has(idx)

                    const icon = isInvalidTo ? (
                      <LuMapPinX size={20} />
                    ) : isFirst ? (
                      <LuMapPinHouse size={20} />
                    ) : isLast ? (
                      <LuMapPinCheck size={20} />
                    ) : (
                      <LuMapPin size={18} />
                    )

                    const address = allAddressesById.get(p.id)

                    const hasNext = !isLast && picks[idx + 1]
                    const nextPick = hasNext ? picks[idx + 1] : null
                    const segmentKey = hasNext && nextPick ? segKey(p.id, nextPick.id) : null
                    const metrics = segmentKey ? metricsMap[segmentKey] : undefined
                    const isLoading = segmentKey ? resolving[segmentKey] && !metrics : false

                    return (
                      <Fragment key={`${p.id}-${idx}`}>
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
                                  borderColor: isInvalidTo
                                    ? 'var(--mantine-color-red-6)'
                                    : 'rgba(56,189,248,.6)',
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
                                        'linear-gradient(135deg, rgba(56,189,248,.28), rgba(129,140,248,.32))',
                                      border: isInvalidTo
                                        ? '1px solid var(--mantine-color-red-6)'
                                        : '1px solid rgba(129,140,248,.8)',
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
                                        {address.address}, {address.postalCode} {address.city}
                                      </Text>
                                    )}
                                  </Box>

                                  {/* Col 3 : monter / descendre / insérer */}
                                  <Group gap="xs">
                                    <Tooltip label="Monter" color="dark">
                                      <ActionIcon
                                        variant="subtle"
                                        aria-label="Monter"
                                        disabled={idx === 0}
                                        onClick={() => {
                                          movePickUp(idx)
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
                                        }}
                                      >
                                        <TbArrowDown />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Insérer une adresse après" color="dark">
                                      <ActionIcon
                                        variant="subtle"
                                        aria-label="Insérer après"
                                        onClick={() => openInsertAfter(idx)}
                                      >
                                        <TbPlus />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>

                                  {/* Col 4 : suppression */}
                                  <Tooltip label="Supprimer l’étape" color="dark">
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
                              borderLeft: '1px dashed rgba(56,189,248,.6)',
                            }}
                          >
                            <Box
                              style={{
                                marginLeft: 8,
                                marginTop: 8,
                                marginBottom: 8,
                              }}
                            >
                              <Group gap="xs" align="center">
                                {isLoading && <Loader size="xs" />}
                                {!isLoading && metrics && (
                                  <>
                                    <Box
                                      className="roadmapp-metric-dot"
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: 'var(--mantine-color-ocean-4)',
                                        boxShadow: `0 0 4px rgba(56,189,248,0.6),
                                          0 0 8px rgba(56,189,248,0.3),
                                          inset 0 0 4px rgba(255,255,255,0.15)
                                          `,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Text size="xs" fw={500} style={{ color: '#e5e7eb' }}>
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
                      </Fragment>
                    )
                  })}
                </Stack>
              </Paper>

              {/* 🔴 Message d'erreur si doublons consécutifs */}
              {hasInvalidSegments && (
                <Paper
                  withBorder
                  radius="lg"
                  p="sm"
                  mt="xs"
                  style={{
                    background: 'rgba(15,23,42,.9)', // fond bleu nuit comme le reste
                    borderColor: 'var(--mantine-color-red-6)',
                  }}
                >
                  <Text size="sm" c="red">
                    Deux étapes consécutives pointent vers la même adresse. Corrigez l&apos;ordre ou
                    supprimez une étape pour pouvoir enregistrer le trajet.
                  </Text>
                </Paper>
              )}

              {/* Bas : bouton aligné à droite */}
              <Group justify="flex-end" mt="md">
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

      {/* Modal d’insertion après une étape */}
      <Modal
        opened={insertForIndex !== null}
        onClose={() => {
          setInsertForIndex(null)
          setInsertValue(null)
        }}
        centered
        size="lg"
        radius="xl"
        withCloseButton={false}
        overlayProps={{
          blur: 4,
          opacity: 0.35,
        }}
        styles={{
          content: {
            background: 'linear-gradient(135deg, rgba(10,16,30,.97), rgba(15,23,42,.97))', // bleu nuit comme le reste
            border: '1px solid rgba(56,189,248,.35)',
            boxShadow: '0 22px 60px rgba(15,23,42,.9)',
          },
          header: {
            display: 'none', // on gère notre propre header dedans
          },
          body: {
            padding: 20,
          },
        }}
      >
        <Stack gap="md">
          {/* Header custom */}
          <Group justify="space-between" align="center">
            <Text fw={600} size="lg">
              Insérer une adresse après cette étape
            </Text>
            <ActionIcon
              variant="subtle"
              aria-label="Fermer"
              onClick={() => {
                setInsertForIndex(null)
                setInsertValue(null)
              }}
            >
              <TbX />
            </ActionIcon>
          </Group>

          <Select
            placeholder="Choisir une adresse"
            data={selectData}
            value={insertValue}
            onChange={setInsertValue}
            searchable
            nothingFoundMessage="Aucune adresse"
            comboboxProps={{
              withinPortal: true,
              zIndex: 4000,
            }}
            maxDropdownHeight={260}
            styles={(theme) => ({
              input: {
                'background': 'rgba(15,23,42,.95)', // bleu nuit comme le reste
                'borderColor': 'rgba(56,189,248,.6)',
                'borderWidth': 1,
                'borderStyle': 'solid',
                'color': '#e5e7eb',
                'borderRadius': 12,
                '::placeholder': {
                  color: '#6b7280',
                },
              },
              dropdown: {
                background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
                border: '1px solid rgba(56,189,248,.35)',
                boxShadow: '0 18px 40px rgba(15,23,42,.9)',
              },
              option: {
                'fontSize': 14,
                'paddingTop': 8,
                'paddingBottom': 8,
                'paddingLeft': 10,
                'paddingRight': 10,
                '&[dataSelected]': {
                  '&, &:hover': {
                    backgroundColor: 'rgba(56,189,248,.28)',
                    color: theme.white,
                  },
                },
                '&[dataHovered]': {
                  backgroundColor: 'rgba(56,189,248,.18)',
                },
              },
            })}
          />

          {/* Boutons */}
          <Group justify="flex-end" gap="xs">
            <Button
              onClick={() => {
                setInsertForIndex(null)
                setInsertValue(null)
              }}
            >
              Annuler
            </Button>
            <Button leftSection={<LuMapPin />} onClick={confirmInsertAfter} disabled={!insertValue}>
              Insérer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

Create.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Create
