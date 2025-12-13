import { Head } from '@inertiajs/react'
import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { BarChart } from '@mantine/charts'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { TbArrowRight, TbCalendarTime, TbMapPin2, TbRoute, TbTimeline } from 'react-icons/tb'
import { LuMapPin } from 'react-icons/lu'
import UserLayout from '~/layouts/user_layout'
import authUser from '~/hooks/auth'

type DashboardPeriod = 'week' | 'month' | 'year' | 'custom'

export interface DashboardTravelItem {
  id: number
  dateLabel: string
  fromLabel: string
  toLabel: string
  distanceLabel: string
  durationLabel?: string
  stepsCount: number
  status?: 'completed' | 'draft' | 'cancelled'
}

export interface DistancePoint {
  label: string
  distanceKm: number
}

export interface DashboardChartData {
  week: DistancePoint[]
  month: DistancePoint[]
  year: DistancePoint[]
}

export interface DashboardSummary {
  distanceThisMonthKm: number
  travelsThisMonth: number
  distanceThisYearKm: number
}

interface DashboardProps {
  summary: DashboardSummary
  chart: DashboardChartData
  recentTravels: DashboardTravelItem[]
  userName: string
}

function Dashboard({ summary, chart, recentTravels }: DashboardProps) {
  const user = authUser()
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null])

  // Données pour la période personnalisée
  const [customData, setCustomData] = useState<DistancePoint[]>([])
  const [customLoading, setCustomLoading] = useState(false)

  const isCustom = period === 'custom'

  // Clé pour les données "de base" (week / month / year)
  const baseKey: keyof DashboardChartData =
    period === 'week' || period === 'month' || period === 'year' ? period : 'month'

  const baseData = chart[baseKey] ?? []
  const chartData: DistancePoint[] = isCustom ? customData : baseData

  // Helper pour convertir ce que renvoie Mantine en YYYY-MM-DD
  const toIsoDate = (value: unknown): string | null => {
    if (!value) return null
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10)
    }
    const d = new Date(value as any)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  }

  // Fetch des données quand on est en mode personnalisé et qu'on a 2 dates
  useEffect(() => {
    if (!isCustom) {
      setCustomData([])
      return
    }

    const [fromRaw, toRaw] = range
    const from = toIsoDate(fromRaw)
    const to = toIsoDate(toRaw)

    if (!from || !to) {
      setCustomData([])
      return
    }

    const params = new URLSearchParams({ from, to })

    setCustomLoading(true)

    fetch(`/dashboard/stats?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load custom stats')
        const json = await res.json()
        setCustomData(json.data ?? [])
      })
      .catch(() => {
        setCustomData([])
      })
      .finally(() => setCustomLoading(false))
  }, [isCustom, range[0], range[1]])

  return (
    <>
      <Head title="Dashboard" />

      <Container size="lg" py="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={4}>
              <Title order={2}>Bonjour, {user.user?.name}</Title>
              <Text size="sm" c="dimmed">
                Vue d’ensemble de vos trajets, distances et adresses.
              </Text>
            </Stack>

            <DashboardHeaderStats summary={summary} />
          </Group>

          {/* Graph & Timeline (graph en premier) */}
          <Grid gutter="lg">
            {/* Graph plus large */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <DashboardDistanceChartCard
                period={period}
                onPeriodChange={setPeriod}
                range={range}
                onRangeChange={setRange}
                data={chartData}
                isCustomLoading={customLoading}
              />
            </Grid.Col>

            {/* Derniers trajets */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <DashboardTimeline travels={recentTravels} />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  )
}

// Layout Inertia
Dashboard.layout = (page: any) => <UserLayout>{page}</UserLayout>

export default Dashboard

// -----------------------------------------------------------------------------
// Header stats
// -----------------------------------------------------------------------------

interface DashboardHeaderStatsProps {
  summary: DashboardSummary
}

function DashboardHeaderStats({ summary }: DashboardHeaderStatsProps) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)

  const averageDistance =
    summary.travelsThisMonth > 0
      ? Math.round((summary.distanceThisMonthKm / summary.travelsThisMonth) * 10) / 10
      : 0

  return (
    <Paper
      withBorder
      radius="xl"
      p="sm"
      style={{
        minWidth: isMobile ? '100%' : 460,
        maxWidth: '100%',
      }}
    >
      {isMobile ? (
        // Mobile : les 3 stats en colonne, bien lisibles
        <Stack gap="sm">
          <MiniStat
            label="Distance ce mois-ci"
            value={`${summary.distanceThisMonthKm.toLocaleString('fr-FR')} km`}
            icon={<TbTimeline size={16} />}
          />
          <MiniStat
            label="Trajets ce mois-ci"
            value={
              summary.travelsThisMonth > 0
                ? `${summary.travelsThisMonth} (${averageDistance} km / trajet)`
                : 'Aucun'
            }
            icon={<TbRoute size={16} />}
          />
          <MiniStat
            label="Distance cette année"
            value={`${summary.distanceThisYearKm.toLocaleString('fr-FR')} km`}
            icon={<TbCalendarTime size={16} />}
          />
        </Stack>
      ) : (
        // Desktop : aligné sur une ligne
        <Group gap="lg" justify="space-between">
          <MiniStat
            label="Distance ce mois-ci"
            value={`${summary.distanceThisMonthKm.toLocaleString('fr-FR')} km`}
            icon={<TbTimeline size={16} />}
          />
          <MiniStat
            label="Trajets ce mois-ci"
            value={
              summary.travelsThisMonth > 0
                ? `${summary.travelsThisMonth} (${averageDistance} km / trajet)`
                : 'Aucun'
            }
            icon={<TbRoute size={16} />}
          />
          <MiniStat
            label="Distance cette année"
            value={`${summary.distanceThisYearKm.toLocaleString('fr-FR')} km`}
            icon={<TbCalendarTime size={16} />}
          />
        </Group>
      )}
    </Paper>
  )
}

interface MiniStatProps {
  label: string
  value: string
  icon?: React.ReactNode
}

function MiniStat({ label, value, icon }: MiniStatProps) {
  return (
    <Group gap="xs" align="center" wrap="nowrap">
      {icon && (
        <Box
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: rem(26),
            height: rem(26),
            borderRadius: rem(999),
            background:
              'radial-gradient(circle at 30% 0%, rgba(120,220,255,0.95), rgba(8,30,46,1))',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}

      <Stack gap={2} align="flex-start">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="sm" fw={600}>
          {value}
        </Text>
      </Stack>
    </Group>
  )
}

// -----------------------------------------------------------------------------
// Timeline des derniers trajets (activité récente)
// -----------------------------------------------------------------------------

interface DashboardTimelineProps {
  travels: DashboardTravelItem[]
}

function DashboardTimeline({ travels }: DashboardTimelineProps) {
  return (
    <Paper withBorder radius="lg" shadow="sm" p="md">
      <Group justify="space-between" mb="xs">
        <div>
          <Text size="xs" c="dimmed" fw={500}>
            Activité récente
          </Text>
          <Text fw={600}>Derniers trajets</Text>
        </div>
        {travels.length > 0 && (
          <Badge variant="light" size="sm">
            {travels.length} trajet{travels.length > 1 ? 's' : ''}
          </Badge>
        )}
      </Group>

      {travels.length === 0 ? (
        <Text size="sm" c="dimmed">
          Aucun trajet récent. Crée ton premier trajet pour voir apparaître l’historique ici.
        </Text>
      ) : (
        <Stack gap="sm" mt="sm">
          {travels.map((travel) => (
            <Paper
              key={travel.id}
              p="sm"
              radius="md"
              withBorder
              style={{
                borderColor: 'rgba(255,255,255,.08)',
                background: 'linear-gradient(135deg, rgba(40,55,90,.3), rgba(5,10,25,.9))',
              }}
            >
              <Group align="flex-start" gap="md">
                {/* Icône LuMapPin à gauche */}
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: rem(34),
                    height: rem(34),
                    borderRadius: rem(999),
                    background:
                      'radial-gradient(circle at 30% 0%, rgba(120,220,255,0.95), rgba(8,30,46,1))',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), 0 8px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
                    flexShrink: 0,
                  }}
                >
                  <LuMapPin size={18} />
                </Box>

                {/* Contenu à droite : 2 noms + pills */}
                <Stack gap={6} style={{ flex: 1 }}>
                  {/* Noms des adresses */}
                  <Stack gap={2}>
                    <Group gap={6} align="center">
                      <Text size="sm" fw={600} style={{ paddingLeft: 4 }}>
                        {travel.fromLabel}
                      </Text>
                      <TbArrowRight size={14} />
                      <Text size="sm" fw={600}>
                        {travel.toLabel}
                      </Text>
                    </Group>
                  </Stack>

                  {/* Pills info */}
                  <Group gap="xs" wrap="wrap">
                    <Badge
                      variant="light"
                      size="sm"
                      radius="xl"
                      leftSection={<TbCalendarTime size={12} />}
                    >
                      {travel.dateLabel}
                    </Badge>

                    <Badge
                      variant="light"
                      size="sm"
                      radius="xl"
                      leftSection={<TbMapPin2 size={12} />}
                    >
                      {travel.distanceLabel}
                    </Badge>

                    {typeof travel.stepsCount === 'number' && (
                      <Badge variant="light" size="sm" radius="xl">
                        {travel.stepsCount} étape{travel.stepsCount > 1 ? 's' : ''}
                      </Badge>
                    )}

                    {travel.durationLabel && (
                      <Badge variant="outline" size="sm" radius="xl">
                        {travel.durationLabel}
                      </Badge>
                    )}

                    {travel.status && (
                      <Badge
                        size="sm"
                        radius="xl"
                        variant="dot"
                        color={
                          travel.status === 'completed'
                            ? 'teal'
                            : travel.status === 'draft'
                              ? 'yellow'
                              : 'red'
                        }
                      >
                        {travel.status === 'completed'
                          ? 'Terminé'
                          : travel.status === 'draft'
                            ? 'Brouillon'
                            : 'Annulé'}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

// -----------------------------------------------------------------------------
// ChartContainer : évite le warning width(-1)/height(-1) de Recharts
// -----------------------------------------------------------------------------

const MIN_CHART_DIMENSION = 32

interface ChartContainerProps {
  children: React.ReactNode
}

function ChartContainer({ children }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = (rect?: DOMRectReadOnly | DOMRect) => {
      const r = rect ?? el.getBoundingClientRect()
      if (r.width >= MIN_CHART_DIMENSION && r.height >= MIN_CHART_DIMENSION) {
        setIsReady(true)
      }
    }

    update()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          update(entry.contentRect)
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      data-chart-ready={isReady ? 'true' : 'false'}
      style={{
        width: '100%',
        minWidth: 0,
        minHeight: 260,
        display: 'flex',
        justifyContent: 'center',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 120ms ease-out',
        pointerEvents: isReady ? 'auto' : 'none',
      }}
    >
      {isReady ? children : null}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Carte histogramme des distances
// -----------------------------------------------------------------------------

interface DashboardDistanceChartCardProps {
  period: DashboardPeriod
  onPeriodChange: (value: DashboardPeriod) => void
  range: [Date | null, Date | null]
  onRangeChange: (value: [Date | null, Date | null]) => void
  data: DistancePoint[]
  isCustomLoading?: boolean
}

function DashboardDistanceChartCard({
  period,
  onPeriodChange,
  range,
  onRangeChange,
  data,
  isCustomLoading,
}: DashboardDistanceChartCardProps) {
  const isCustom = period === 'custom'
  const total = data.reduce((sum, point) => sum + point.distanceKm, 0)

  return (
    <Paper withBorder radius="lg" shadow="sm" p="md">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" c="dimmed" fw={500}>
              Statistiques
            </Text>
            <Text fw={600}>Kilomètres parcourus</Text>
          </div>
        </Group>

        {/* Filtres + picker */}
        <Stack gap="6">
          <Group gap="xs" align="center">
            <SegmentedControl
              radius="xl"
              size="xs"
              value={period}
              onChange={(value: string) => onPeriodChange(value as DashboardPeriod)}
              styles={{
                root: {
                  background: 'rgba(15,23,42,0.90)',
                  border: '1px solid rgba(56,189,248,0.35)',
                  borderRadius: 999,
                  padding: 3,
                  gap: 0,
                },
                indicator: {
                  background: 'rgba(22,30,49,1)',
                  border: '1px solid rgba(56,189,248,0.5)',
                  borderRadius: 999,
                  transition: 'all .20s ease',
                },
                label: {
                  'position': 'relative',
                  'fontSize': 13,
                  'fontWeight': 500,
                  'padding': '6px 16px',
                  'color': '#94a3b8',
                  '&[dataActive]': {
                    color: '#38bdf8',
                    fontWeight: 600,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '25%',
                    height: '50%',
                    width: '1px',
                    background: 'rgba(56,189,248,0.25)',
                  },
                  '&:lastOfType::after': {
                    display: 'none',
                  },
                },
              }}
              data={[
                { label: 'Semaine', value: 'week' },
                { label: 'Mois', value: 'month' },
                { label: 'Année', value: 'year' },
                { label: 'Perso', value: 'custom' },
              ]}
            />
          </Group>

          {isCustom && (
            <Box mt={2} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <DatePickerInput
                type="range"
                value={range}
                onChange={(value) => onRangeChange(value as [Date | null, Date | null])}
                size="xs"
                radius="xl"
                defaultLevel="year"
                popoverProps={{
                  withinPortal: true,
                  shadow: 'xl',
                  radius: 'lg',
                  styles: {
                    dropdown: {
                      background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
                      border: '1px solid rgba(148,163,184,.45)',
                    },
                  },
                }}
                leftSection={<TbCalendarTime size={14} />}
                placeholder="Période personnalisée"
                clearable
                styles={{
                  input: {
                    background: 'rgba(15,23,42,.9)',
                    borderColor: 'rgba(56,189,248,.6)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: '#e5e7eb',
                  },
                  day: {
                    '&[data-selected]': {
                      background:
                        'linear-gradient(135deg, rgba(56,189,248,.8), rgba(129,140,248,.9))',
                      color: 'white',
                    },
                    '&[data-in-range]': {
                      background: 'rgba(56,189,248,.15)',
                    },
                    '&[data-weekend]': {
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
            </Box>
          )}
        </Stack>

        {/* Chart */}
        <Box mt="xs" style={{ minWidth: 0, width: '100%', minHeight: 260 }}>
          {isCustom && isCustomLoading ? (
            <Text size="sm" c="dimmed">
              Chargement des données pour cette période…
            </Text>
          ) : data.length === 0 ? (
            <Text size="sm" c="dimmed">
              Pas encore de données pour cette période.
            </Text>
          ) : (
            <ChartContainer>
              <BarChart
                h={260}
                data={data}
                dataKey="label"
                series={[{ name: 'distanceKm', label: 'Distance (km)' }]}
                withXAxis
                withYAxis
                withTooltip
                unit=" km"
                valueFormatter={(value) =>
                  (value as number).toLocaleString('fr-FR', {
                    maximumFractionDigits: 1,
                  })
                }
                tickLine="y"
                barProps={{ radius: 8 }}
                tooltipProps={{
                  cursor: { fill: 'rgba(81,204,255,0.12)' },
                  content: ({ label, payload }) => (
                    <DistanceChartTooltip label={label} payload={payload} />
                  ),
                }}
              />
            </ChartContainer>
          )}
        </Box>

        {/* Total */}
        <Group justify="space-between" mt="xs">
          <Text size="sm" c="dimmed">
            Total de la période
          </Text>
          <Text size="sm" fw={600}>
            {total.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}

interface DistanceChartTooltipProps {
  label: React.ReactNode
  payload?: readonly any[]
}

function DistanceChartTooltip({ label, payload }: DistanceChartTooltipProps) {
  if (!payload || payload.length === 0) return null
  const item = payload[0]
  const value = item?.value as number | undefined

  return (
    <Paper px="sm" py={6} radius="lg" withBorder shadow="md">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      {typeof value === 'number' && (
        <Text size="sm" fw={600}>
          {value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
        </Text>
      )}
    </Paper>
  )
}
