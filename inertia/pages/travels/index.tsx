// inertia/pages/travels/index.tsx
import { Head, router } from '@inertiajs/react'
import { Container, Group, Pagination, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { PaginationMeta } from '~/types/app'
import { PageInfoButton } from '~/components/page_info'

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

  useEffect(() => {
    setItems(travels)
    setPage(meta.currentPage)
  }, [travels, meta.currentPage])

  const gotoPage = (p: number) => {
    router.get('/travels', { page: p }, { preserveState: true, preserveScroll: true })
  }

  return (
    <>
      <Head title="Trajets" />
      <Container py="lg">
        <Group justify="space-between" mb="md" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Trajets</Title>
            <PageInfoButton page="travels" ariaLabel="Afficher l’aide sur les trajets" />
          </Group>
        </Group>

        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              sortFn: (a: TravelRow, b: TravelRow) => a.date.localeCompare(b.date),
            },
            { key: 'distanceToString', label: 'Distance' },
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
    </>
  )
}

Index.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Index
