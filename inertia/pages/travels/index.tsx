// inertia/pages/travels/index.tsx
import { Head, router } from '@inertiajs/react'
import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Pagination,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { TbMapPinPlus } from 'react-icons/tb'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { PaginationMeta } from '~/types/app'
import { PageInfoButton } from '~/components/page_info'
import { TravelActionMenu } from '~/components/travels/travel_action_menu'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import { FlashMessages } from '~/components/flash_messages'
import { jsonFetch } from '~/services/http'
import { BackButton } from '~/components/generics/back_buttons'
import { ClickableBreadcrumbs } from '~/components/generics/clickable_breadcrumbs'

type TravelRow = {
  id: number
  date: string
  distance: number
  distanceToString: string
  stepsCount?: number
}

interface IndexProps {
  travels: TravelRow[]
  meta: PaginationMeta
}

function Index({ travels, meta }: IndexProps) {
  const [items, setItems] = useState(travels)
  const [page, setPage] = useState(meta.currentPage)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    setItems(travels)
    setPage(meta.currentPage)
  }, [travels, meta.currentPage])

  const gotoPage = (p: number) => {
    router.get('/travels', { page: p }, { preserveState: true })
  }

  const goCreate = () => {
    router.visit('/travels/create')
  }

  const askDelete = (id: number) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setConfirmLoading(true)
    setFlash(null)
    try {
      await jsonFetch(`/api/travels/${deleteId}`, {
        method: 'DELETE',
        parseResponse: false, // l’API renvoie juste un JSON de succès, pas besoin de le lire
      })

      setFlash({ type: 'success', message: 'Trajet supprimé' })
      router.reload({ only: ['travels', 'meta'] })
    } catch (error: any) {
      setFlash({
        type: 'error',
        message: error?.message ?? 'Erreur lors de la suppression du trajet',
      })
    } finally {
      setConfirmLoading(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Head title="Trajets" />
      <FlashMessages flash={flash} />
      <Container py="lg">
        <Group mb="md" align="center" gap="xs">
          <BackButton href="/dashboard" />
          <ClickableBreadcrumbs
            items={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Trajets' }]}
          />
        </Group>
        <Group justify="space-between" mb="md" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Trajets</Title>
            <PageInfoButton page="travels" ariaLabel="Afficher l’aide sur les trajets" />
          </Group>

          <Button
            onClick={goCreate}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
            leftSection={<TbMapPinPlus size={16} />}
            aria-label="Créer un trajet"
          >
            Créer un trajet
          </Button>
        </Group>

        {/* Vue desktop : tableau */}
        <Box visibleFrom="sm">
          <DataTable<TravelRow>
            columns={[
              {
                key: 'date',
                label: 'DATE',
                sortFn: (a, b) => a.date.localeCompare(b.date),
                render: (row) => (
                  <Text size="sm">{new Date(row.date).toLocaleDateString('fr-FR')}</Text>
                ),
              },
              {
                key: 'distanceToString',
                label: 'DISTANCE',
                render: (row) => (
                  <Text size="sm" fw={500}>
                    {row.distanceToString}
                  </Text>
                ),
              },
              {
                key: 'steps',
                label: 'ÉTAPES',
                render: (row) => {
                  const count = row.stepsCount ?? 0
                  return (
                    <Badge variant="light" color="ocean" radius="xl" size="sm">
                      {count} étape{count > 1 ? 's' : ''}
                    </Badge>
                  )
                },
              },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <TravelActionMenu
                    onEdit={() => router.visit(`/travels/${row.id}/edit`)}
                    onDelete={() => askDelete(row.id)}
                  />
                ),
                align: 'right',
                width: 80,
              },
            ]}
            data={items}
            emptyMessage="Aucun trajet"
          />

          <Pagination
            total={meta.lastPage}
            value={page}
            onChange={(p) => {
              setPage(p)
              gotoPage(p)
            }}
            mt="md"
          />
        </Box>

        {/* Vue mobile : cards */}
        <Box hiddenFrom="sm">
          <Stack gap="sm">
            {items.length === 0 && (
              <Text size="sm" c="dimmed">
                Aucun trajet pour le moment.
              </Text>
            )}

            {items.map((row) => {
              const count = row.stepsCount ?? 0
              return (
                <Paper
                  key={row.id}
                  withBorder
                  radius="lg"
                  p="sm"
                  style={{
                    background: 'rgba(15,23,42,0.96)',
                    borderColor: 'rgba(56,189,248,0.45)',
                  }}
                >
                  <Stack gap={6}>
                    <Group justify="space-between" align="flex-start" gap="xs">
                      <Stack gap={2}>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={600}>
                            Trajet #{row.id}
                          </Text>
                          <Badge variant="outline" size="xs" radius="xl">
                            {new Date(row.date).toLocaleDateString('fr-FR')}
                          </Badge>
                        </Group>

                        <Group gap={6}>
                          <Badge variant="light" color="ocean" radius="xl" size="xs">
                            {row.distanceToString}
                          </Badge>
                          <Badge variant="outline" color="ocean" radius="xl" size="xs">
                            {count} étape{count > 1 ? 's' : ''}
                          </Badge>
                        </Group>
                      </Stack>

                      <TravelActionMenu
                        onEdit={() => router.visit(`/travels/${row.id}/edit`)}
                        onDelete={() => askDelete(row.id)}
                      />
                    </Group>
                  </Stack>
                </Paper>
              )
            })}

            {meta.lastPage > 1 && (
              <Group justify="center" mt="sm">
                <Pagination
                  total={meta.lastPage}
                  value={page}
                  onChange={(p) => {
                    setPage(p)
                    gotoPage(p)
                  }}
                  size="sm"
                />
              </Group>
            )}
          </Stack>
        </Box>
      </Container>

      <ConfirmDeleteModal
        opened={confirmOpen}
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false)
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
        description="Ce trajet sera définitivement supprimé."
      />
    </>
  )
}

Index.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Index
