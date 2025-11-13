// inertia/components/addresses/address_book.tsx
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useMemo } from 'react'
import { TbHome } from 'react-icons/tb'

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

/**
 * Bouton d’adresse :
 * - n’affiche que le nom
 * - tooltip = adresse complète
 * - un peu d’animation hover/active
 */
function AddressItem({
  addr,
  onAdd,
}: {
  addr: AddressBookAddress
  onAdd: (addr: AddressBookAddress) => void
}) {
  const fullAddress = `${addr.address}, ${addr.postalCode} ${addr.city}`

  return (
    <Tooltip label={fullAddress} withArrow openDelay={250}>
      <Button
        onClick={() => onAdd(addr)}
        variant="light"
        color="gray"
        radius="xl"
        size="md"
        fullWidth
        styles={{
          root: {
            justifyContent: 'center',
            background: 'rgba(255,255,255,.06)',
            transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
            backdropFilter: 'blur(4px)',
          },
          label: {
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            textAlign: 'center',
          },
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.transform = ''
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = ''
        }}
      >
        {addr.name}
      </Button>
    </Tooltip>
  )
}

/**
 * Carnet d’adresses :
 * - groupé par initiale (A / B / …)
 * - affichage du nombre total
 * - bouton Maison à côté du titre
 * - on n’affiche pas l’adresse isHome dans la liste (uniquement via le bouton maison)
 */
export function AddressBook({
  addresses,
  homeAddress,
  onAdd,
  title = 'Carnet d’adresses',
}: AddressBookProps) {
  // on exclut isHome de la liste (on a le bouton dédié)
  const list = useMemo(() => addresses.filter((a) => !a.isHome), [addresses])

  const groups = useMemo(() => {
    const map = new Map<string, AddressBookAddress[]>()
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name))

    for (const a of sorted) {
      const first = (a.name?.[0] || '#').toUpperCase()
      const key = /[A-ZÀ-ÖØ-Ý]/.test(first) ? first : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }

    return [...map.entries()]
      .filter(([, arr]) => arr.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  }, [list])

  return (
    <Paper withBorder p="md" radius="lg">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Title order={4}>{title}</Title>
          {homeAddress && (
            <Tooltip label="Ajouter l’adresse Maison" withArrow>
              <ActionIcon
                variant="light"
                title="Ajouter Maison"
                aria-label="Ajouter Maison"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd(homeAddress)
                }}
              >
                <TbHome />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        <Badge variant="light">{list.length}</Badge>
      </Group>

      <Stack gap="xs" style={{ maxHeight: 460, overflowY: 'auto' }}>
        {groups.map(([letter, arr]) => (
          <Stack key={letter} gap="xs">
            <Divider
              my="xs"
              label={<Text fw={700}>{letter}</Text>}
              labelPosition="left"
              styles={{
                label: { color: 'var(--mantine-color-dimmed)' },
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
