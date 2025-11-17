import {
  ActionIcon,
  Badge,
  Button,
  Combobox,
  Divider,
  Group,
  Input,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  useCombobox,
} from '@mantine/core'
import { useMemo, useState } from 'react'
import { TbHome, TbSearch } from 'react-icons/tb'

export type AddressBookAddress = {
  id: number
  name: string
  address: string
  postalCode: string
  city: string
  isHome?: boolean
}

type AddressBookProps = {
  addresses: AddressBookAddress[]
  homeAddress?: AddressBookAddress | null
  onAdd: (addr: AddressBookAddress) => void
  title?: string
}

function AddressItem({
  addr,
  onAdd,
}: {
  addr: AddressBookAddress
  onAdd: (addr: AddressBookAddress) => void
}) {
  const fullAddress = `${addr.address}, ${addr.postalCode} ${addr.city}`

  return (
    <Tooltip
      label={fullAddress}
      withArrow
      openDelay={250}
      color="dark"
      position="right"
      styles={{
        tooltip: {
          background: 'linear-gradient(180deg, rgba(7,14,24,.96), rgba(7,14,24,.9))',
          border: '1px solid rgba(255,255,255,.12)',
          boxShadow: '0 18px 45px rgba(15,23,42,.85)',
        },
        arrow: {
          background: 'linear-gradient(180deg, rgba(7,14,24,.96), rgba(7,14,24,.9))',
        },
      }}
    >
      <Button
        onClick={() => onAdd(addr)}
        variant="subtle"
        radius="xl"
        size="md"
        fullWidth
        styles={{
          root: {
            'justifyContent': 'flex-start',
            'background': 'rgba(15,23,42,.88)',
            'border': '1px solid rgba(148,163,184,.35)',
            'backdropFilter': 'blur(10px)',
            'paddingInline': '0.75rem',
            'transition':
              'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease',
            '&:hover': {
              background: 'linear-gradient(120deg, rgba(56,189,248,.16), rgba(129,140,248,.12))',
              borderColor: 'rgba(129,140,248,.85)',
              boxShadow: '0 14px 35px rgba(15,23,42,.9)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(1px) scale(0.98)',
              boxShadow: '0 6px 18px rgba(15,23,42,.75)',
            },
          },
          label: {
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            textAlign: 'left',
            letterSpacing: '0.01em',
          },
        }}
      >
        {addr.name}
      </Button>
    </Tooltip>
  )
}

export function AddressBook({
  addresses,
  homeAddress,
  onAdd,
  title = 'Carnet d’adresses',
}: AddressBookProps) {
  // On exclut la maison de la liste (bouton dédié)
  const list = useMemo(() => addresses.filter((a) => !a.isHome), [addresses])

  // Groupes alphabétiques
  const groups = useMemo(() => {
    const map = new Map<string, AddressBookAddress[]>()
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name))

    for (const a of sorted) {
      const first = (a.name?.[0] || '#').toUpperCase()
      const key = /[A-ZÀ-ÖØ-Ý]/.test(first) ? first : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }

    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [list])

  // 🔍 Nouvel état pour la recherche
  const [search, setSearch] = useState('')
  const combobox = useCombobox()

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return []

    return list.filter((a) =>
      `${a.name} ${a.address} ${a.city} ${a.postalCode}`.toLowerCase().includes(s)
    )
  }, [search, list])

  return (
    <Paper
      withBorder
      p="md"
      radius="lg"
      shadow="sm"
      style={{
        background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Title order={4}>{title}</Title>

          {/* 🏠 Bouton Maison */}
          {homeAddress && (
            <Tooltip label="Ajouter l’adresse Maison" withArrow color="dark" position="right">
              <ActionIcon
                variant="light"
                aria-label="Ajouter Maison"
                onClick={(e) => {
                  e.preventDefault()
                  onAdd(homeAddress)
                }}
              >
                <TbHome size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* 🔍 Nouveau bouton recherche */}
          <Combobox
            store={combobox}
            width={260}
            position="bottom-start"
            offset={6}
            shadow="md"
            onOptionSubmit={(value) => {
              const addr = addresses.find((a) => String(a.id) === value)
              if (addr) onAdd(addr)
              combobox.closeDropdown()
              setSearch('')
            }}
            styles={{
              dropdown: {
                background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
                border: '1px solid rgba(56,189,248,.35)',
                boxShadow: '0 18px 40px rgba(15,23,42,.9)',
              },
              option: {
                'margin': '10px 0',
                'padding': '6px 10px',
                'cursor': 'pointer',
                '&[data-hovered]': {
                  backgroundColor: 'rgba(56,189,248,.18)',
                },
              },
            }}
          >
            <Combobox.Target>
              <Tooltip label="Rechercher une adresse" withArrow color="dark">
                <ActionIcon
                  variant="light"
                  aria-label="Rechercher"
                  onClick={() => {
                    combobox.toggleDropdown()
                    setTimeout(() => {
                      const el = document.getElementById('address-search-input')
                      el?.focus()
                    }, 50)
                  }}
                >
                  <TbSearch size={16} />
                </ActionIcon>
              </Tooltip>
            </Combobox.Target>

            <Combobox.Dropdown>
              <Stack gap={4} p={6}>
                <Input
                  id="address-search-input"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  styles={{
                    input: {
                      background: 'rgba(15,23,42,.95)',
                      borderColor: 'rgba(56,189,248,.6)',
                      color: '#e5e7eb',
                    },
                  }}
                />

                <Combobox.Options>
                  {filtered.length === 0 && <Combobox.Empty>Aucun résultat</Combobox.Empty>}

                  {filtered.map((addr) => (
                    <Combobox.Option key={addr.id} value={String(addr.id)}>
                      <Text fw={500}>{addr.name}</Text>
                      <Text size="xs" c="dimmed">
                        {addr.address}, {addr.postalCode} {addr.city}
                      </Text>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Stack>
            </Combobox.Dropdown>
          </Combobox>
        </Group>

        <Badge variant="light" size="sm">
          {addresses.length} adresse{addresses.length > 1 ? 's' : ''}
        </Badge>
      </Group>

      <Text size="xs" c="dimmed" mb="sm">
        Sélectionnez une adresse pour l’ajouter au trajet.
      </Text>

      <Divider my="sm" opacity={0.5} />

      <Stack gap="xs" style={{ maxHeight: 460, overflowY: 'auto' }}>
        {groups.map(([letter, arr]) => (
          <Stack key={letter} gap={4}>
            <Divider
              label={letter}
              labelPosition="left"
              styles={{
                label: {
                  color: 'var(--mantine-color-dimmed)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                },
              }}
            />
            <Stack gap="xs">
              {arr.map((addr) => (
                <AddressItem key={addr.id} addr={addr} onAdd={onAdd} />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
