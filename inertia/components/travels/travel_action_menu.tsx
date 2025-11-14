import { Menu } from '@mantine/core'
import { TbEdit, TbTrash } from 'react-icons/tb'
import { ActionMenu } from '~/components/generics/action_menu'

export interface TravelActionMenuProps {
  onEdit: () => void
  onDelete: () => void
}

export function TravelActionMenu({ onEdit, onDelete }: TravelActionMenuProps) {
  return (
    <ActionMenu ariaLabel="Actions sur le trajet">
      <Menu.Item leftSection={<TbEdit size={14} />} onClick={onEdit}>
        Modifier
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item color="red" leftSection={<TbTrash size={14} />} onClick={onDelete}>
        Supprimer
      </Menu.Item>
    </ActionMenu>
  )
}
