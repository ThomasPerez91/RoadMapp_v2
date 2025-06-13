import { Head, router } from '@inertiajs/react'
import {
  Container,
  Pagination,
  TextInput,
  Box,
  ScrollArea,
  Highlight,
  Button,
  Badge,
  Group,
  Menu,
  ActionIcon,
} from '@mantine/core'
import { TbDots, TbEdit, TbTrash, TbPlayerPause, TbPlayerPlay } from 'react-icons/tb'
import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { Address, PaginationMeta } from '~/types/app'
import { useAppDrawer } from '~/components/drawer'
import { AddressForm } from '~/components/addresses/address_form'
import { FlashMessages } from '~/components/flash_messages'

interface IndexProps {
  addresses: Address[]
  meta: PaginationMeta
}

function Index({ addresses, meta }: IndexProps) {
  const { open } = useAppDrawer()
  const [items, setItems] = useState(addresses)
  const [page, setPage] = useState(meta.currentPage)
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 300)
  const [results, setResults] = useState<Address[]>([])
  useEffect(() => {
    setItems(addresses)
  }, [addresses])

  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  const openUpdate = (addr: Address) => {
    setFlash(null)
    open({
      title: 'Modifier une adresse',
      content: (
        <AddressForm
          address={addr}
          onSuccess={() => {
            setFlash({ type: 'success', message: 'Adresse mise à jour' })
            router.reload({ only: ['addresses', 'meta'] })
          }}
        />
      ),
    })
  }

  const toggleActive = async (addr: Address) => {
    setFlash(null)
    try {
      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !addr.isActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Erreur inconnue')
      }
      setFlash({ type: 'success', message: 'Adresse mise à jour' })
      router.reload({ only: ['addresses', 'meta'] })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
  }

  const destroyAddress = async (id: number) => {
    if (!confirm('Confirmer la suppression ?')) return
    setFlash(null)
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Erreur inconnue')
      }
      setFlash({ type: 'success', message: 'Adresse supprimée' })
      router.reload({ only: ['addresses', 'meta'] })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
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
        <Group justify="space-between" mb="sm">
          <FlashMessages flash={flash} />
          <Button
            onClick={() => {
              setFlash(null)
              open({
                title: 'Ajouter une adresse',
                content: (
                  <AddressForm
                    onSuccess={() => {
                      setFlash({ type: 'success', message: 'Adresse ajoutée' })
                      router.reload({ only: ['addresses', 'meta'] })
                    }}
                  />
                ),
              })
            }}
          >
            Ajouter une adresse
          </Button>
        </Group>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom', sortFn: (a: Address, b: Address) => a.name.localeCompare(b.name) },
            { key: 'address', label: 'Adresse' },
            { key: 'postalCode', label: 'Code postal' },
            { key: 'city', label: 'Ville', sortFn: (a: Address, b: Address) => a.city.localeCompare(b.city) },
            {
              key: 'isActive',
              label: 'Active',
              render: (row: Address) => (
                <Badge color={row.isActive ? 'blue' : 'red'} variant="filled">
                  {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'checked',
              label: 'Checked',
              render: (row: Address) => (
                <Badge color={row.checked ? 'blue' : 'red'} variant="filled">
                  {row.checked ? 'Checked' : 'Failed'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              label: '',
              render: (row: Address) => (
                <Menu withinPortal shadow="md">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <TbDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item icon={<TbEdit size={14} />} onClick={() => openUpdate(row)}>
                      Update
                    </Menu.Item>
                    <Menu.Item
                      icon={row.isActive ? <TbPlayerPause size={14} /> : <TbPlayerPlay size={14} />}
                      onClick={() => toggleActive(row)}
                    >
                      {row.isActive ? 'Deactivate' : 'Activate'}
                    </Menu.Item>
                    <Menu.Item color="red" icon={<TbTrash size={14} />} onClick={() => destroyAddress(row.id)}>
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ),
            },
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
