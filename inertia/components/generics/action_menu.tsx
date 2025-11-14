// inertia/components/generics/action_menu.tsx
import { ActionIcon, Menu, type MenuProps } from '@mantine/core'
import type React from 'react'
import { TbDots } from 'react-icons/tb'

export const dropdownStyles = {
  background: 'linear-gradient(180deg, rgba(7,14,24,.92), rgba(7,14,24,.80))',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,.06)',
} as const

interface ActionMenuProps {
  children: React.ReactNode
  iconSize?: number
  menuProps?: Partial<MenuProps>
  /**
   * Quand true, ajoute data-used="true" sur le bouton de trigger.
   * Utile pour styliser les éléments déjà utilisés (ex: adresse utilisée dans un trajet).
   */
  used?: boolean
  ariaLabel?: string
}

/**
 * Menu d’actions générique avec un bouton 3 points.
 * Les menus spécifiques (adresses, trajets, etc.) se basent dessus.
 */
export function ActionMenu({
  children,
  iconSize = 16,
  menuProps,
  used = false,
  ariaLabel = 'Actions',
}: ActionMenuProps) {
  return (
    <Menu withinPortal shadow="md" {...menuProps}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={ariaLabel}
          data-used={used ? 'true' : 'false'}
        >
          <TbDots size={iconSize} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown style={dropdownStyles}>{children}</Menu.Dropdown>
    </Menu>
  )
}
