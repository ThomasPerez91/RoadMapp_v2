import { Menu, type MenuProps } from '@mantine/core'
import { TbEdit, TbPlayerPause, TbPlayerPlay, TbTrash } from 'react-icons/tb'
import type { Address } from '~/types/app'
import { ActionMenu } from '~/components/generics/action_menu'

interface AddressActionMenuProps {
  address: Address
  onEdit: (address: Address) => void
  onToggleActive: (address: Address) => void
  onDelete?: (address: Address) => void
  iconSize?: number
  menuProps?: Partial<MenuProps>
}

export function AddressActionMenu({
  address,
  onEdit,
  onToggleActive,
  onDelete,
  iconSize = 16,
  menuProps,
}: AddressActionMenuProps) {
  return (
    <ActionMenu
      used={address.used}
      iconSize={iconSize}
      menuProps={menuProps}
      ariaLabel="Actions sur l’adresse"
    >
      <Menu.Item leftSection={<TbEdit size={14} />} onClick={() => onEdit(address)}>
        Mettre à jour
      </Menu.Item>
      <Menu.Item
        leftSection={address.isActive ? <TbPlayerPause size={14} /> : <TbPlayerPlay size={14} />}
        onClick={() => onToggleActive(address)}
      >
        {address.isActive ? 'Archiver' : 'Restaurer'}
      </Menu.Item>

      {!address.used && onDelete && (
        <>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<TbTrash size={14} />}
            onClick={() => onDelete(address)}
          >
            Supprimer
          </Menu.Item>
        </>
      )}
    </ActionMenu>
  )
}
