import { Head, router } from '@inertiajs/react'
import {
  Container,
  Pagination,
  TextInput,
  Box,
  Button,
  Badge,
  Group,
  Menu,
  ActionIcon,
  Paper,
  Stack,
  Title,
  useMantineTheme,
  rem,
  Divider,
} from '@mantine/core'
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks'
import {
  TbDots,
  TbEdit,
  TbTrash,
  TbPlayerPause,
  TbPlayerPlay,
  TbMapPin,
  TbArchive,
} from 'react-icons/tb'
import { useState, useEffect, useMemo } from 'react'
import { DataTable } from '~/components/generics/data_table'
import UserLayout from '~/layouts/user_layout'
import type { Address, PaginationMeta } from '~/types/app'
import { useAppDrawer } from '~/components/drawer'
import { AddressForm } from '~/components/addresses/address_form'
import { FlashMessages } from '~/components/flash_messages'

interface IndexProps {
  addresses: Address[]
  meta: PaginationMeta
  status?: 'active' | 'archived' // <- injecté côté serveur
}

function normalize(str: string) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function getCsrfTokenFromCookie(): string {
  if (typeof document === 'undefined') return ''
  const cookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))
  if (!cookie) return ''
  return decodeURIComponent(cookie.split('=')[1] || '')
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

  const hasSearch = debounced.trim().length > 0

  const displayItems = useMemo(() => (hasSearch ? results : items), [hasSearch, results, items])

  useEffect(() => setItems(addresses), [addresses])
  useEffect(() => setPage(meta.currentPage), [meta.currentPage])

  // Navigation helper
  const goto = (p: number, s: 'active' | 'archived') => {
    router.get('/addresses', { page: p, status: s }, { preserveState: true })
  }

  // Toggle entre Actives / Archivées
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

    fetch(`/api/addresses/search?q=${encodeURIComponent(q)}&active=${active ? 'true' : 'false'}`)
      .then((r) => r.json())
      .then((list: Address[]) => {
        const nq = normalize(q)
        // on remet en tête celles dont le nom commence par le terme (en plus du filtre back)
        const starts = list.filter((a) => normalize(a.name).startsWith(nq))
        const others = list.filter((a) => !normalize(a.name).startsWith(nq))
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
      const csrfToken = getCsrfTokenFromCookie()

      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          // on renvoie tout ce que le validator attend
          name: addr.name,
          address: addr.address,
          postal_code: addr.postalCode,
          city: addr.city,
          is_active: !addr.isActive,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Erreur inconnue')
      }

      setFlash({
        type: 'success',
        message: addr.isActive ? 'Adresse archivée' : 'Adresse restaurée',
      })

      router.reload({ only: ['addresses', 'meta'] })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
  }

  const destroyAddress = async (id: number) => {
    if (!confirm('Confirmer la suppression ?')) return
    setFlash(null)
    try {
      const csrfToken = getCsrfTokenFromCookie()

      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
      })

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

  const title = status === 'active' ? 'Carnet d’adresses' : 'Carnet d’adresses archivées'

  return (
    <>
      <Head title="Carnet d'adresses" />
      <FlashMessages flash={flash} />
      <Container size="lg">
        <Group justify="space-between" mb="sm" wrap="wrap">
          <Title order={3}>{title}</Title>
          <Group gap="md">
            {/* Toggle Actives/Archivées */}
            <Button
              variant="light"
              radius="xl"
              onClick={toggleStatus}
              leftSection={<TbArchive size={16} />}
            >
              {status === 'active' ? 'Voir archivées' : 'Voir actives'}
            </Button>

            {/* Ajouter visible sur la vue Actives (tu peux le laisser partout si tu veux) */}
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

        {/* Recherche + suggestions live */}
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
                  <Menu withinPortal shadow="md">
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label="Actions"
                        data-used={row.used ? 'true' : 'false'}
                      >
                        <TbDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown
                      style={{
                        background: 'linear-gradient(180deg, rgba(7,14,24,.92), rgba(7,14,24,.80))',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,.06)',
                      }}
                    >
                      <Menu.Item leftSection={<TbEdit size={14} />} onClick={() => openUpdate(row)}>
                        Mettre à jour
                      </Menu.Item>
                      <Menu.Item
                        leftSection={
                          row.isActive ? <TbPlayerPause size={14} /> : <TbPlayerPlay size={14} />
                        }
                        onClick={() => toggleActive(row)}
                      >
                        {row.isActive ? 'Archiver' : 'Restaurer'}
                      </Menu.Item>

                      {!row.used && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<TbTrash size={14} />}
                            onClick={() => destroyAddress(row.id)}
                          >
                            Supprimer
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
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
                  <Menu withinPortal shadow="md" position="bottom-end" offset={4}>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label="Actions"
                        data-used={row.used ? 'true' : 'false'} // 👈 attr DOM
                      >
                        <TbDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown
                      style={{
                        background: 'linear-gradient(180deg, rgba(7,14,24,.92), rgba(7,14,24,.80))',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,.06)',
                      }}
                    >
                      <Menu.Item leftSection={<TbEdit size={14} />} onClick={() => openUpdate(row)}>
                        Mettre à jour
                      </Menu.Item>
                      <Menu.Item
                        leftSection={
                          row.isActive ? <TbPlayerPause size={14} /> : <TbPlayerPlay size={14} />
                        }
                        onClick={() => toggleActive(row)}
                      >
                        {row.isActive ? 'Archiver' : 'Restaurer'}
                      </Menu.Item>

                      {/* ❌ pas de bouton Supprimer si used */}
                      {!row.used && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<TbTrash size={14} />}
                            onClick={() => destroyAddress(row.id)}
                          >
                            Supprimer
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
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
      </Container>
    </>
  )
}

Index.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Index
