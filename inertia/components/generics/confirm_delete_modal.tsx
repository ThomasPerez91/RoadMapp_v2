import { Modal, Button, Group, Text } from '@mantine/core'
import { useEffect, useRef } from 'react'

type Props = {
  opened: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  icon?: React.ReactNode
}

export function ConfirmDeleteModal({
  opened,
  title = 'Confirmer la suppression',
  description = 'Cette action est définitive. Voulez-vous vraiment supprimer cet élément ?',
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  loading = false,
  danger = true,
  onConfirm,
  onCancel,
  icon,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (opened) setTimeout(() => confirmRef.current?.focus(), 0)
  }, [opened])

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      centered
      title={title}
      withCloseButton={!loading}
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
      radius="lg"
      styles={{
        header: {
          background: 'transparent',
          borderBottom: 'none',
          paddingBottom: 0,
        },
        title: {
          fontWeight: 600,
        },
        close: {
          color: 'var(--mantine-color-dimmed)',
        },
      }}
    >
      <Group align="start" mb="md" gap="sm" wrap="nowrap">
        {icon}
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Group>

      <Group justify="end">
        <Button variant="default" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          ref={confirmRef}
          color={danger ? 'red' : 'blue'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  )
}
