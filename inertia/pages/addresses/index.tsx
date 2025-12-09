import { Head, router } from '@inertiajs/react'
import {
  Container,
  Pagination,
  TextInput,
  Box,
  Button,
  Badge,
  Group,
  Paper,
  Stack,
  Title,
  useMantineTheme,
  rem,
  Divider,
} from '@mantine/core'
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks'
import { TbMapPin, TbArchive } from 'react-icons/tb'
import { useState, useEffect, useMemo } from 'react'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { Address, PaginationMeta } from '~/types/app'
import { useAppDrawer } from '~/components/drawer'
import { AddressForm } from '~/components/addresses/address_form'
import { AddressActionMenu } from '~/components/addresses/address_action_menu'
import { FlashMessages } from '~/components/flash_messages'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import { deleteAddress, searchAddresses, toggleAddressActive } from '~/services/addresses'
import { PageInfoButton } from '~/components/page_info'
import { BackButton } from '~/components/generics/back_buttons'
import { ClickableBreadcrumbs } from '~/components/generics/clickable_breadcrumbs'

interface IndexProps {
  addresses: Address[]
  meta: PaginationMeta
  status?: 'active' | 'archived'
}

function normalize(str: string) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function Index({ addresses, meta, status: initialStatus = 'active' }: IndexProps) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)

  const { open } = useAppDrawer()
  const [items, setItems] = useState(addresses)
  const [page, setPage] = useState(meta.currentPage)
  const [status, setStatus] = useState<'active' | 'archived'>(initialStatus)

  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 250)

  const [results, setResults] = useState<Address[]>([])
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const hasSearch = debounced.trim().length > 0
  const displayItems = useMemo(() => (hasSearch ? results : items), [hasSearch, results, items])

  useEffect(() => setItems(addresses), [addresses])
  useEffect(() => setPage(meta.currentPage), [meta.currentPage])

  const goto = (p: number, s: 'active' | 'archived') => {
    router.get('/addresses', { page: p, status: s }, { preserveState: true })
  }

  const toggleStatus = () => {
    const next = status === 'active' ? 'archived' : 'active'
    setStatus(next)
    setQuery('')
    setResults([])
    goto(1, next)
  }

  useEffect(() => {
    const q = debounced.trim()
    if (!q) {
      setResults([])
      return
    }
    const active = status === 'active'

    searchAddresses(q, active)
      .then((list) => {
        const safeList = Array.isArray(list) ? list : []
        const nq = normalize(q)
        const starts = safeList.filter((a) => normalize(a.name).startsWith(nq))
        const others = safeList.filter((a) => !normalize(a.name).startsWith(nq))
        setResults([...starts, ...others])
      })
      .catch(() => setResults([]))
  }, [debounced, status])

  const openCreate = () => {
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
      await toggleAddressActive(addr)

      setFlash({
        type: 'success',
        message: addr.isActive ? 'Adresse archivée' : 'Adresse restaurée',
      })

      router.reload({ only: ['addresses', 'meta'] })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
  }

  const askDelete = (id: number) => {
    setFlash(null)
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setConfirmLoading(true)
    try {
      await deleteAddress(deleteId)
      setFlash({ type: 'success', message: 'Adresse supprimée' })
      router.reload({ only: ['addresses', 'meta'] })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    } finally {
      setConfirmLoading(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const title = status === 'active' ? 'Carnet d’adresses' : 'Carnet d’adresses archivées'

  return (
    <>
      <Head title="Carnet d'adresses" />
      <FlashMessages flash={flash} />
      <Container size="lg">
        <Stack gap="md">
          <Group gap="xs" align="center">
            <BackButton href="/dashboard" />
            <ClickableBreadcrumbs
              items={[
                { label: 'Tableau de bord', href: '/dashboard' },
                { label: 'Carnet d’adresses', href: '/addresses' },
              ]}
            />
          </Group>
          <Group justify="space-between" mb="sm" wrap="wrap" align="center">
            <Group gap="xs" align="center">
              <Title order={3}>{title}</Title>
              <PageInfoButton page="addresses" ariaLabel="Afficher l’aide du carnet d’adresses" />
            </Group>
            <Group gap="md">
              <Button
                variant="light"
                radius="xl"
                onClick={toggleStatus}
                leftSection={<TbArchive size={16} />}
              >
                {status === 'active' ? 'Voir archivées' : 'Voir actives'}
              </Button>

              {status === 'active' && (
                <Button
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                  onClick={openCreate}
                  leftSection={<TbMapPin size={16} />}
                >
                  Ajouter une adresse
                </Button>
              )}
            </Group>
          </Group>

          <Box pos="relative" mb="md">
            <TextInput
              placeholder={status === 'active' ? 'Recherche (actives)…' : 'Recherche (archivées)…'}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              radius="md"
            />
          </Box>

          {isMobile ? (
            <Stack gap="sm">
              {displayItems.map((row) => (
                <Paper
                  key={row.id}
                  p="md"
                  radius="lg"
                  withBorder
                  style={{
                    background: 'rgba(7,14,24,.60)',
                    border: '1px solid rgba(255,255,255,.06)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Title order={5} style={{ marginBottom: rem(4) }}>
                        {row.name}
                      </Title>
                      <div style={{ opacity: 0.9 }}>
                        {row.address}
                        <br />
                        {row.postalCode} {row.city}
                      </div>
                      <Group gap="xs" mt="xs">
                        <Badge color={row.isActive ? 'ocean' : 'red'} variant="filled">
                          {row.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge color={row.checked ? 'ocean' : 'red'} variant="light">
                          {row.checked ? 'Checked' : 'Failed'}
                        </Badge>
                      </Group>
                    </div>
                    <AddressActionMenu
                      address={row}
                      onEdit={openUpdate}
                      onToggleActive={toggleActive}
                      onDelete={(addr) => askDelete(addr.id)}
                      iconSize={18}
                    />
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <DataTable<Address>
              columns={[
                { key: 'name', label: 'NOM', sortFn: (a, b) => a.name.localeCompare(b.name) },
                { key: 'address', label: 'ADRESSE' },
                { key: 'postalCode', label: 'CODE POSTAL' },
                { key: 'city', label: 'VILLE', sortFn: (a, b) => a.city.localeCompare(b.city) },
                {
                  key: 'isActive',
                  label: 'STATUT',
                  render: (row) => (
                    <Badge color={row.isActive ? 'ocean' : 'red'} variant="filled">
                      {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <AddressActionMenu
                      address={row}
                      onEdit={openUpdate}
                      onToggleActive={toggleActive}
                      onDelete={(addr) => askDelete(addr.id)}
                      menuProps={{ position: 'bottom-end', offset: 4 }}
                    />
                  ),
                },
              ]}
              data={displayItems}
            />
          )}

          <Divider my="md" />
          {!hasSearch && (
            <Pagination
              total={meta.lastPage}
              value={page}
              onChange={(p) => {
                setPage(p)
                goto(p, status)
              }}
              mt="xs"
            />
          )}
        </Stack>
      </Container>

      <ConfirmDeleteModal
        opened={confirmOpen}
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false)
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
        description="Cette adresse sera définitivement supprimée."
      />
    </>
  )
}

Index.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Index
