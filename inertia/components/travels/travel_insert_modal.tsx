// inertia/components/travels/travel_insert_modal.tsx
import { ActionIcon, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { TbX } from 'react-icons/tb'
import { LuMapPin } from 'react-icons/lu'

export interface TravelInsertModalProps {
  opened: boolean
  selectData: { value: string; label: string }[]
  insertValue: string | null
  onChangeValue: (value: string | null) => void
  onClose: () => void
  onConfirm: () => void
}

export function TravelInsertModal({
  opened,
  selectData,
  insertValue,
  onChangeValue,
  onClose,
  onConfirm,
}: TravelInsertModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      radius="xl"
      withCloseButton={false}
      overlayProps={{
        blur: 4,
        opacity: 0.35,
      }}
      styles={{
        content: {
          background: 'linear-gradient(135deg, rgba(10,16,30,.97), rgba(15,23,42,.97))',
          border: '1px solid rgba(56,189,248,.35)',
          boxShadow: '0 22px 60px rgba(15,23,42,.9)',
        },
        header: {
          display: 'none',
        },
        body: {
          padding: 20,
        },
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={600} size="lg">
            Insérer une adresse après cette étape
          </Text>
          <ActionIcon variant="subtle" aria-label="Fermer" onClick={onClose}>
            <TbX />
          </ActionIcon>
        </Group>

        <Select
          placeholder="Choisir une adresse"
          data={selectData}
          value={insertValue}
          onChange={onChangeValue}
          searchable
          nothingFoundMessage="Aucune adresse"
          comboboxProps={{
            withinPortal: true,
            zIndex: 4000,
          }}
          maxDropdownHeight={260}
          styles={(theme) => ({
            input: {
              background: 'rgba(15,23,42,.95)',
              borderColor: 'rgba(56,189,248,.6)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#e5e7eb',
              borderRadius: 12,
              '::placeholder': {
                color: '#6b7280',
              },
            },
            dropdown: {
              background: 'linear-gradient(145deg, rgba(7,14,24,.98), rgba(15,23,42,.96))',
              border: '1px solid rgba(56,189,248,.35)',
              boxShadow: '0 18px 40px rgba(15,23,42,.9)',
            },
            option: {
              fontSize: 14,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 10,
              paddingRight: 10,
              '&[dataSelected]': {
                '&, &:hover': {
                  backgroundColor: 'rgba(56,189,248,.28)',
                  color: theme.white,
                },
              },
              '&[dataHovered]': {
                backgroundColor: 'rgba(15,23,42,.9)',
              },
            },
          })}
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button leftSection={<LuMapPin />} onClick={onConfirm} disabled={!insertValue}>
            Insérer
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
