// inertia/pages/travels/template_export.tsx
import { Head } from '@inertiajs/react'
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import React, { useEffect, useState } from 'react'
import UserLayout from '~/layouts/user_layout'
import { BackButton } from '~/components/generics/back_buttons'
import { ClickableBreadcrumbs } from '~/components/generics/clickable_breadcrumbs'
import { jsonFetch } from '~/services/http'

type DateValue = Date | string | null
type DateRange = [DateValue, DateValue]

interface TravelTemplateLeg {
  distanceToString: string
  fromAddressText: string
  toAddressText: string
}

interface TravelTemplateRow {
  id: number
  date: string
  distanceToString: string
  stepsCount: number
  legs?: TravelTemplateLeg[]
}

interface TravelTemplatePreview {
  from: string
  to: string
  totalKm: number
  totalSteps: number
  rows: TravelTemplateRow[]
}

const TemplateExportTravels = () => {
  const [range, setRange] = useState<DateRange>([null, null])
  const [detailed, setDetailed] = useState(false)
  const [preview, setPreview] = useState<TravelTemplatePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [effectiveFrom, setEffectiveFrom] = useState<string | null>(null)
  const [effectiveTo, setEffectiveTo] = useState<string | null>(null)
  const [effectiveDetailed, setEffectiveDetailed] = useState<boolean>(false)

  const toIsoDate = (value: DateValue): string | null => {
    if (!value) return null
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    if (typeof value === 'string') return value.slice(0, 10)
    return null
  }

  const formatFr = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString('fr-FR') : ''

  const hasData = !!preview && preview.rows.length > 0

  useEffect(() => {
    const [fromRaw, toRaw] = range
    const from = toIsoDate(fromRaw)
    const to = toIsoDate(toRaw)

    if (!from || !to) {
      setPreview(null)
      setEffectiveFrom(null)
      setEffectiveTo(null)
      setEffectiveDetailed(false)
      setError(null)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          from,
          to,
          detailed: detailed ? '1' : '0',
        })

        const data = await jsonFetch<TravelTemplatePreview>(
          `/api/travels/template-export/preview?${params.toString()}`
        )

        if (data) {
          setPreview(data)
          setEffectiveFrom(data.from)
          setEffectiveTo(data.to)
          setEffectiveDetailed(detailed)
        }
      } catch (e: any) {
        setError(e.message || 'Une erreur est survenue lors du chargement de l’aperçu.')
        setPreview(null)
        setEffectiveFrom(null)
        setEffectiveTo(null)
        setEffectiveDetailed(false)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [range, detailed])

  const canDownload = !!effectiveFrom && !!effectiveTo && hasData

  const buildDownloadHref = (format: 'xlsx' | 'pdf'): string => {
    if (!canDownload) return '#'
    const params = new URLSearchParams({
      from: effectiveFrom!,
      to: effectiveTo!,
      detailed: effectiveDetailed ? '1' : '0',
    })
    return `/api/travels/template-export/${format}?${params.toString()}`
  }

  const xlsxHref = buildDownloadHref('xlsx')
  const pdfHref = buildDownloadHref('pdf')

  const renderSummaryTable = (data: TravelTemplatePreview) => {
    const totalStepsLabel = data.totalSteps.toString()
    const totalKmLabel = `${data.totalKm.toLocaleString('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`

    return (
      <Table withTableBorder withColumnBorders horizontalSpacing="md" verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                DATE
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                ETAPES
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                DISTANCE
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.rows.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Text size="sm" c="gray.0">
                  {new Date(row.date).toLocaleDateString('fr-FR')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="gray.0">
                  {row.stepsCount ?? 0}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="gray.0">
                  {row.distanceToString}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}

          <Table.Tr
            style={{
              backgroundColor: '#111827',
            }}
          >
            <Table.Td>
              <Text size="sm" fw={700} c="gray.0">
                TOTAL
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" fw={700} c="gray.0">
                {totalStepsLabel}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" fw={700} c="gray.0">
                {totalKmLabel}
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    )
  }

  const renderDetailedTable = (data: TravelTemplatePreview) => {
    return (
      <Table withTableBorder withColumnBorders horizontalSpacing="md" verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                DATE
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                ETAPES
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                DISTANCE
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                DÉPART
              </Text>
            </Table.Th>
            <Table.Th style={{ backgroundColor: '#020617' }}>
              <Text size="xs" fw={700} c="gray.0">
                ARRIVÉE
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.rows.map((row) => (
            <React.Fragment key={row.id}>
              <Table.Tr>
                <Table.Td>
                  <Text size="sm" fw={600} c="gray.0">
                    {new Date(row.date).toLocaleDateString('fr-FR')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c="gray.0">
                    {row.stepsCount ?? 0}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c="gray.0">
                    {row.distanceToString}
                  </Text>
                </Table.Td>
                <Table.Td />
                <Table.Td />
              </Table.Tr>

              {row.legs &&
                row.legs.map((leg, index) => (
                  <Table.Tr key={`${row.id}-${index}`}>
                    <Table.Td />
                    <Table.Td>
                      <Text size="sm" c="gray.0">
                        {index + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="gray.0">
                        {leg.distanceToString}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="gray.0" style={{ whiteSpace: 'pre-line' }}>
                        {leg.fromAddressText}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="gray.0" style={{ whiteSpace: 'pre-line' }}>
                        {leg.toAddressText}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </React.Fragment>
          ))}
        </Table.Tbody>
      </Table>
    )
  }

  return (
    <>
      <Head title="Export avec template" />

      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group gap="sm">
            <BackButton href="/travels" />
            <ClickableBreadcrumbs
              items={[
                { label: 'Tableau de bord', href: '/dashboard' },
                { label: 'Trajets', href: '/travels' },
                { label: 'Export avec template' },
              ]}
            />
          </Group>

          <Group justify="space-between" align="flex-end" wrap="wrap">
            <div>
              <Title order={2}>Exporter mes trajets</Title>
              <Text size="sm" c="dimmed">
                Choisissez une période, choisissez le niveau de détail, visualisez l’aperçu puis
                téléchargez en PDF ou Excel.
              </Text>
            </div>

            <Stack gap={4}>
              <DatePickerInput
                type="range"
                valueFormat="DD MMM YYYY"
                value={range}
                onChange={(value) => setRange(value as DateRange)}
                placeholder="Sélectionner une période"
                size="sm"
                radius="md"
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

              <Checkbox
                checked={detailed}
                onChange={(event) => setDetailed(event.currentTarget.checked)}
                label={
                  <Text size="sm" c="ocean.4">
                    Afficher le détail des étapes
                  </Text>
                }
                size="sm"
                styles={{
                  input: {
                    background: 'rgba(15,23,42,.9)',
                    borderColor: 'rgba(56,189,248,.6)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                  },
                  icon: {
                    color: '#0ea5e9',
                  },
                  label: {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Stack>
          </Group>

          {/* PREVIEW PDF-LIKE */}
          <Paper
            withBorder
            radius="lg"
            p="lg"
            bg="#020617"
            styles={{
              root: {
                borderColor: 'rgba(148,163,184,0.45)',
              },
            }}
          >
            <Stack gap="md">
              {error && (
                <Text size="sm" c="red.4">
                  {error}
                </Text>
              )}

              {!error && !hasData && !loading && (
                <Text size="sm" c="gray.3" ta="center">
                  Aucun trajet à afficher pour le moment. Sélectionnez une période pour générer
                  l’aperçu.
                </Text>
              )}

              {!error && loading && (
                <Text size="sm" c="gray.3" ta="center">
                  Mise à jour de l’aperçu...
                </Text>
              )}

              {hasData && preview && (
                <Paper
                  shadow="sm"
                  radius="md"
                  p="xl"
                  withBorder
                  bg="#020617"
                  styles={{
                    root: {
                      borderColor: 'rgba(148,163,184,0.45)',
                    },
                  }}
                >
                  <Stack gap="md">
                    {/* logo + titres */}
                    <Box ta="center">
                      <img
                        src="/logo.svg"
                        alt="RoadMapp"
                        style={{ height: 60, marginBottom: 16 }}
                      />
                      <Text fw={700} size="xl" c="gray.0">
                        ROADMAPP
                      </Text>
                      <Text fw={700} size="sm" mt={4} c="gray.0">
                        HISTORIQUE DES TRAJETS DU
                      </Text>
                      <Text size="sm" mt={2} c="gray.1">
                        DU {formatFr(preview.from)} AU {formatFr(preview.to)}
                      </Text>
                    </Box>

                    <Divider my="sm" color="rgba(55,65,81,0.8)" />

                    <Group justify="space-between" align="center">
                      <Text size="sm" c="gray.1">
                        Période effective :{' '}
                        <strong>
                          du {formatFr(preview.from)} au {formatFr(preview.to)}
                        </strong>
                      </Text>
                      <Text size="sm" fw={600} c="gray.0">
                        Total : {preview.totalSteps.toString()} étapes,{' '}
                        {preview.totalKm.toLocaleString('fr-FR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                        km
                      </Text>
                    </Group>

                    <Box mt="sm">
                      {!effectiveDetailed && renderSummaryTable(preview)}
                      {effectiveDetailed && renderDetailedTable(preview)}
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Paper>

          <Group justify="flex-end">
            <Button
              size="sm"
              radius="md"
              variant="light"
              component="a"
              href={xlsxHref}
              disabled={!canDownload}
            >
              Télécharger en Excel
            </Button>
            <Button size="sm" radius="md" component="a" href={pdfHref} disabled={!canDownload}>
              Télécharger en PDF
            </Button>
          </Group>
        </Stack>
      </Container>
    </>
  )
}

TemplateExportTravels.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>

export default TemplateExportTravels
