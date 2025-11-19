import { Box, Paper, Stack, Text } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import { AddressBook } from '~/components/addresses/address_book'

export interface TravelDateAndAddressBookProps {
  date: Date | null
  onDateChange: (date: Date | null) => void
  addresses: Address[]
  homeAddress: Address | null
  onAddAddress: (address: Address) => void
}

export function TravelDateAndAddressBook({
  date,
  onDateChange,
  addresses,
  homeAddress,
  onAddAddress,
}: TravelDateAndAddressBookProps) {
  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="lg">
        <Stack gap="xs">
          <Text size="sm">Date du trajet</Text>
          <DateInput
            value={date}
            onChange={(value) => onDateChange(value ? new Date(value) : null)}
            valueFormat="DD/MM/YYYY"
            aria-label="Date du trajet"
            popoverProps={{
              withinPortal: true,
              shadow: 'xl',
              radius: 'lg',
              styles: {
                dropdown: {
                  background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
                  border: '1px solid rgba(148,163,184,.45)',
                },
              },
            }}
            styles={{
              input: {
                background: 'rgba(15,23,42,.9)',
                borderColor: 'rgba(56,189,248,.6)',
                borderWidth: 1,
                borderStyle: 'solid',
                color: '#e5e7eb',
              },
              day: {
                '&[dataSelected]': {
                  background:
                    'linear-gradient(135deg, rgba(56,189,248,.8), rgba(129,140,248,.9))',
                  color: 'white',
                },
                '&[dataInRange]': {
                  background: 'rgba(56,189,248,.15)',
                },
                '&[dataWeekend]': {
                  color: '#f97373',
                },
              },
              weekday: {
                color: '#9ca3af',
                fontWeight: 500,
              },
              month: {
                color: '#e5e7eb',
                fontWeight: 600,
              },
            }}
          />
        </Stack>
      </Paper>

      {/* Carnet d’adresses visible seulement sur desktop */}
      <Box visibleFrom="md">
        <AddressBook
          addresses={addresses}
          homeAddress={homeAddress ?? undefined}
          onAdd={onAddAddress}
        />
      </Box>
    </Stack>
  )
}
