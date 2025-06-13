import { Head, router } from '@inertiajs/react'
import {
  Container,
  Pagination,
  TextInput,
  Box,
  ScrollArea,
  Highlight,
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { Address, PaginationMeta } from '~/types/app'

interface IndexProps {
  addresses: Address[]
  meta: PaginationMeta
}

function Index({ addresses, meta }: IndexProps) {
  const [page, setPage] = useState(meta.currentPage)
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 300)
  const [results, setResults] = useState<Address[]>([])

  useEffect(() => {
    if (debounced.trim() === '') {
      setResults([])
      return
    }

    fetch(`/api/addresses/search?q=${debounced}`)
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setResults([]))
  }, [debounced])

  const resultItems = results.flatMap((addr) => {
    const entries: Array<[string, string]> = [
      ['Nom', addr.name],
      ['Adresse', addr.address],
      ['Ville', addr.city],
    ]
    return entries
      .filter(([, val]) => val.toLowerCase().includes(debounced.toLowerCase()))
      .map(([label, val]) => ({ id: addr.id, label, value: val }))
  })

  const gotoPage = (p: number) => {
    router.get('/addresses', { page: p }, { preserveState: true })
  }

  return (
    <>
      <Head title="Carnet d'adresses" />
      <Container>
        <Box pos="relative" mb="md">
          <TextInput
            placeholder="Recherche"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          {resultItems.length > 0 && (
            <Box pos="absolute" w="100%" bg="white" mt="xs" p="xs" shadow="sm" style={{ zIndex: 10 }}>
              <ScrollArea h={150}>
                {resultItems.map((r) => (
                  <Box key={`${r.id}-${r.label}`} py={4}>
                    <b>{r.label}: </b>
                    <Highlight highlight={debounced}>{r.value}</Highlight>
                  </Box>
                ))}
              </ScrollArea>
            </Box>
          )}
        </Box>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom', sortFn: (a: Address, b: Address) => a.name.localeCompare(b.name) },
            { key: 'address', label: 'Adresse' },
            { key: 'postalCode', label: 'Code postal' },
            { key: 'city', label: 'Ville', sortFn: (a: Address, b: Address) => a.city.localeCompare(b.city) },
            {
              key: 'isHome',
              label: 'Home',
              render: (row: Address) => (row.isHome ? '✅' : ''),
            },
          ]}
          data={addresses}
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
