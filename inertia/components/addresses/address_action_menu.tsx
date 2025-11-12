import { ActionIcon, Menu, type MenuProps } from '@mantine/core'
import { TbDots, TbEdit, TbPlayerPause, TbPlayerPlay, TbTrash } from 'react-icons/tb'
import type { Address } from '~/types/app'

const dropdownStyles = {
  background: 'linear-gradient(180deg, rgba(7,14,24,.92), rgba(7,14,24,.80))',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,.06)',
} as const

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
    <Menu withinPortal shadow="md" {...menuProps}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Actions"
          data-used={address.used ? 'true' : 'false'}
        >
          <TbDots size={iconSize} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown style={dropdownStyles}>
        <Menu.Item leftSection={<TbEdit size={14} />} onClick={() => onEdit(address)}>
          Mettre à jour
        </Menu.Item>
        <Menu.Item
          leftSection={
            address.isActive ? <TbPlayerPause size={14} /> : <TbPlayerPlay size={14} />
          }
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
      </Menu.Dropdown>
    </Menu>
  )
}
