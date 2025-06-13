import { Head, router } from '@inertiajs/react'
import { Container, Pagination } from '@mantine/core'
import { useState, useEffect } from 'react'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { Travel, PaginationMeta } from '~/types/app'

interface IndexProps {
  travels: Travel[]
  meta: PaginationMeta
}

function Index({ travels, meta }: IndexProps) {
  const [items, setItems] = useState(travels)
  const [page, setPage] = useState(meta.currentPage)

  useEffect(() => {
    setItems(travels)
  }, [travels])

  const gotoPage = (p: number) => {
    router.get('/travels', { page: p }, { preserveState: true })
  }

  return (
    <>
      <Head title="Trajets" />
      <Container>
        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              sortFn: (a: Travel, b: Travel) => a.date.localeCompare(b.date),
            },
            { key: 'distanceToString', label: 'Distance' },
          ]}
          data={items}
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

