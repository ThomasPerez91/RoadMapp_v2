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
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { BarChart } from '@mantine/charts'
import { useState } from 'react'
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

  const effectivePeriod: Exclude<DashboardPeriod, 'custom'> = period === 'custom' ? 'month' : period

  const chartData = chart[effectivePeriod] ?? []

  return (
    <>
      <Head title="Dashboard" />

      <Container size="lg" py="md">
        <Stack gap="lg">
          {/* Header + bandeau fin de stats */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2}>Bonjour, {user.user?.name}</Title>
              <Text size="sm" c="dimmed">
                Vue d’ensemble de vos trajets, distances et adresses.
              </Text>
            </Stack>

            <DashboardHeaderStats summary={summary} />
          </Group>

          {/* Timeline & Graph */}
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DashboardTimeline travels={recentTravels} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <DashboardDistanceChartCard
                period={period}
                onPeriodChange={setPeriod}
                range={range}
                onRangeChange={setRange}
                data={chartData}
              />
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
// Bandeau de stats mince dans le header (élargi + icônes)
// -----------------------------------------------------------------------------

interface DashboardHeaderStatsProps {
  summary: DashboardSummary
}

/**
 * Bandeau compact : 3 mini stats avec label + valeur + petite icône.
 */
function DashboardHeaderStats({ summary }: DashboardHeaderStatsProps) {
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
        minWidth: 460,
        maxWidth: '100%',
      }}
    >
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
    <Group gap="xs" align="center">
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

/**
 * Activité récente :
 * - Icône LuMapPin à gauche de la card
 * - 2 noms d’adresses à droite
 * - Pills en dessous (un peu plus grandes)
 */
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
                      <Text size="sm" fw={600}>
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
                      <Badge variant="outline" size="sm" radius="xl">
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
// Carte histogramme des distances
// -----------------------------------------------------------------------------

interface DashboardDistanceChartCardProps {
  period: DashboardPeriod
  onPeriodChange: (value: DashboardPeriod) => void
  range: [Date | null, Date | null]
  onRangeChange: (value: [Date | null, Date | null]) => void
  data: DistancePoint[]
}

/**
 * Carte “Kilomètres parcourus” avec filtre de période + histogramme
 */
function DashboardDistanceChartCard({
  period,
  onPeriodChange,
  range,
  onRangeChange,
  data,
}: DashboardDistanceChartCardProps) {
  const isCustom = period === 'custom'
  const total = data.reduce((sum, point) => sum + point.distanceKm, 0)

  return (
    <Paper withBorder radius="lg" shadow="sm" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" c="dimmed" fw={500}>
              Statistiques
            </Text>
            <Text fw={600}>Kilomètres parcourus</Text>
            <Text size="xs" c="dimmed" mt={4}>
              Vue agrégée de la distance parcourue sur la période sélectionnée.
            </Text>
          </div>

          <Stack gap={6} align="flex-end">
            <SegmentedControl
              size="xs"
              value={period}
              onChange={(value: string) => onPeriodChange(value as DashboardPeriod)}
              data={[
                { label: 'Semaine', value: 'week' },
                { label: 'Mois', value: 'month' },
                { label: 'Année', value: 'year' },
                { label: 'Perso', value: 'custom' },
              ]}
            />

            {isCustom && (
              <DatePickerInput
                type="range"
                value={range}
                onChange={(value) => onRangeChange(value as [Date | null, Date | null])}
                size="xs"
                placeholder="Choisir une période"
              />
            )}
          </Stack>
        </Group>

        <Box mt="xs">
          {data.length === 0 ? (
            <Text size="sm" c="dimmed">
              Pas encore de données pour cette période.
            </Text>
          ) : (
            <BarChart
              h={260}
              data={data}
              dataKey="label"
              series={[{ name: 'distanceKm', label: 'Distance (km)' }]}
              withXAxis
              withYAxis
              withTooltip
              valueFormatter={(value) =>
                `${(value as number).toLocaleString('fr-FR', {
                  maximumFractionDigits: 1,
                })} km`
              }
              tickLine="y"
            />
          )}
        </Box>

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
