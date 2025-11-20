import { Head, router } from '@inertiajs/react'
import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
  rem,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { BarChart } from '@mantine/charts'
import { useState } from 'react'
import {
  TbArrowRight,
  TbCalendarTime,
  TbMapPin,
  TbMapPin2,
  TbRoute,
  TbTimeline,
} from 'react-icons/tb'
import UserLayout from '~/layouts/user_layout'

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
}

// -----------------------------------------------------------------------------
// Composant principal
// -----------------------------------------------------------------------------

function Dashboard({ summary, chart, recentTravels }: DashboardProps) {
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null])

  // Pour l’instant, le "custom" reuse les données "month"
  const effectivePeriod: Exclude<DashboardPeriod, 'custom'> =
    period === 'custom' ? 'month' : period

  const chartData = chart[effectivePeriod] ?? []

  const handleCreateTravel = () => {
    router.visit('/travels/create')
  }

  const handleGoToAddresses = () => {
    router.visit('/addresses')
  }

  return (
    <>
      <Head title="Dashboard" />

      <Container size="lg" py="md">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="sm" c="dimmed">
                Tableau de bord
              </Text>
              <Title order={2} mt={4}>
                Bonjour 👋
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Vue d’ensemble de vos trajets, distances et adresses.
              </Text>
            </div>

            <Group gap="xs">
              <Button
                variant="light"
                leftSection={<TbMapPin size={16} />}
                onClick={handleGoToAddresses}
              >
                Carnet d’adresses
              </Button>

              <Button leftSection={<TbRoute size={18} />} onClick={handleCreateTravel}>
                Créer un trajet
              </Button>
            </Group>
          </Group>

          {/* Stats rapides */}
          <DashboardStatsStrip summary={summary} />

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
// Sous-composants : bandeau de stats
// -----------------------------------------------------------------------------

interface DashboardStatsStripProps {
  summary: DashboardSummary
}

/**
 * Bandeau de 3 cartes de stats : km/mois, trajets/mois, km/année
 */
function DashboardStatsStrip({ summary }: DashboardStatsStripProps) {
  const averageDistance =
    summary.travelsThisMonth > 0
      ? Math.round((summary.distanceThisMonthKm / summary.travelsThisMonth) * 10) / 10
      : 0

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <StatCard
        label="Distance ce mois-ci"
        value={`${summary.distanceThisMonthKm.toLocaleString('fr-FR')} km`}
        hint="Total des trajets sur le mois en cours"
        icon={<TbTimeline size={18} />}
      />

      <StatCard
        label="Trajets ce mois-ci"
        value={summary.travelsThisMonth.toString()}
        hint={
          averageDistance > 0
            ? `Moyenne de ${averageDistance} km par trajet`
            : 'Aucun trajet sur ce mois'
        }
        icon={<TbRoute size={18} />}
      />

      <StatCard
        label="Distance cette année"
        value={`${summary.distanceThisYearKm.toLocaleString('fr-FR')} km`}
        hint="Depuis le 1er janvier"
        icon={<TbCalendarTime size={18} />}
      />
    </SimpleGrid>
  )
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
}

function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Paper
      withBorder
      radius="lg"
      shadow="sm"
      p="md"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="xs" c="dimmed" fw={500}>
            {label}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
          {hint && (
            <Text size="xs" c="dimmed" mt={4}>
              {hint}
            </Text>
          )}
        </div>

        {icon && (
          <Box
            p={6}
            style={{
              borderRadius: rem(999),
              border: '1px solid rgba(255,255,255,.1)',
              background: 'radial-gradient(circle at 30% 0%, rgba(81,204,255,.35), transparent)',
            }}
          >
            {icon}
          </Box>
        )}
      </Group>
    </Paper>
  )
}

// -----------------------------------------------------------------------------
// Timeline des derniers trajets
// -----------------------------------------------------------------------------

interface DashboardTimelineProps {
  travels: DashboardTravelItem[]
}

/**
 * Timeline des derniers trajets (sous forme de liste de cartes)
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
                background:
                  'linear-gradient(135deg, rgba(56,183,238,.15), rgba(10,10,20,.6))',
              }}
            >
              <Group justify="space-between" align="flex-start" gap="xs">
                <Stack gap={2} style={{ flex: 1 }}>
                  <Group gap={6} align="center">
                    {/* Petit rond bleu lumineux */}
                    <Box
                      mr={4}
                      style={{
                        width: rem(8),
                        height: rem(8),
                        borderRadius: '999px',
                        boxShadow: '0 0 0 4px rgba(56,183,238,.25)',
                        background: 'radial-gradient(circle, #51ccff 0%, #0d3a4c 70%)',
                      }}
                    />
                    <Text size="sm" fw={600}>
                      {travel.fromLabel}
                    </Text>
                    <TbArrowRight size={14} />
                    <Text size="sm" fw={600}>
                      {travel.toLabel}
                    </Text>
                  </Group>

                  <Group gap="xs" wrap="wrap">
                    <Badge
                      variant="light"
                      size="xs"
                      leftSection={<TbCalendarTime size={12} />}
                    >
                      {travel.dateLabel}
                    </Badge>

                    <Badge
                      variant="light"
                      size="xs"
                      leftSection={<TbMapPin2 size={12} />}
                    >
                      {travel.distanceLabel}
                    </Badge>

                    {typeof travel.stepsCount === 'number' && (
                      <Badge variant="outline" size="xs">
                        {travel.stepsCount} étape
                        {travel.stepsCount > 1 ? 's' : ''}
                      </Badge>
                    )}

                    {travel.durationLabel && (
                      <Badge variant="outline" size="xs">
                        {travel.durationLabel}
                      </Badge>
                    )}

                    {travel.status && (
                      <Badge
                        size="xs"
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

                <Box
                  p={6}
                  style={{
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,.08)',
                    background: 'rgba(0,0,0,.25)',
                  }}
                >
                  <TbMapPin size={16} />
                </Box>
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
