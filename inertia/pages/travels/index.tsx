// inertia/pages/travels/index.tsx
import { Head, router } from '@inertiajs/react'
import { Button, Container, Group, Pagination, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { TbMapPinPlus } from 'react-icons/tb'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { PaginationMeta } from '~/types/app'
import { PageInfoButton } from '~/components/page_info'
import { TravelActionMenu } from '~/components/travels/travel_action_menu'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import { FlashMessages } from '~/components/flash_messages'


type TravelRow = {
  id: number
  date: string
  distance: number
  distanceToString: string
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
      await router.delete(`/api/travels/${deleteId}`)
      setFlash({ type: 'success', message: 'Trajet supprimé' })
      router.reload({ only: ['travels', 'meta'] })
    } catch (error: any) {
      setFlash({
        type: 'error',
        message: error.message ?? 'Erreur lors de la suppression du trajet',
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

        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              sortFn: (a: TravelRow, b: TravelRow) => a.date.localeCompare(b.date),
            },
            { key: 'distanceToString', label: 'Distance' },
            {
              key: 'actions',
              label: '',
              render: (row: TravelRow) => (
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
