// inertia/components/travels/travel_address_drawer.tsx
import { ActionIcon, Drawer, Group, Stack, Text, Box } from '@mantine/core'
import { TbX } from 'react-icons/tb'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import { AddressBook } from '~/components/addresses/address_book'

export interface TravelAddressDrawerProps {
  opened: boolean
  onClose: () => void
  addresses: Address[]
  homeAddress: Address | null
  onAddAddress: (address: Address) => void
}

/**
 * Drawer mobile pour la sélection d’adresse.
 *
 * - S’ouvre depuis le bas de l’écran
 * - Prend ~70% de la hauteur pour garder le contexte visible
 * - Header collé en haut avec titre + bouton fermer
 * - Carnet scrollable en dessous
 */
export function TravelAddressDrawer({
  opened,
  onClose,
  addresses,
  homeAddress,
  onAddAddress,
}: TravelAddressDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="70%" // hauteur proportionnelle, fonctionne sur tous les mobiles
      radius="xl"
      padding="md"
      withinPortal
      overlayProps={{ blur: 4, opacity: 0.4 }}
      styles={{
        content: {
          background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
          borderTop: '1px solid rgba(148,163,184,.45)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'var(--mantine-spacing-sm)',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <Stack gap="sm" h="100%">
        {/* Header compact */}
        <Group justify="space-between" align="center" px="md">
          <Text fw={600} size="sm">
            Ajouter une adresse
          </Text>
          <ActionIcon
            variant="subtle"
            aria-label="Fermer le carnet d’adresses"
            onClick={onClose}
          >
            <TbX size={18} />
          </ActionIcon>
        </Group>

        {/* Sous-texte pour mobile */}
        <Text size="xs" c="dimmed" px="md">
          Choisissez un point de départ, une étape ou une arrivée dans votre carnet d’adresses.
        </Text>

        {/* Zone scrollable contenant le carnet */}
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 'var(--mantine-spacing-md)',
            paddingTop: 0,
          }}
        >
          <AddressBook
            addresses={addresses}
            homeAddress={homeAddress ?? undefined}
            onAdd={(addr) => {
              onAddAddress(addr)
            }}
          />
        </Box>
      </Stack>
    </Drawer>
  )
}
