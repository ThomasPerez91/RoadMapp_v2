// inertia/components/links/user_navbar_links.tsx
import { Flex, Group, Text } from '@mantine/core'
import { InternalLink } from './internal_link'
import authUser from '~/hooks/auth'
import { LuLayoutDashboard } from 'react-icons/lu'
import { PiAddressBookBold } from 'react-icons/pi'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { RiMapPin2Line } from 'react-icons/ri'

interface UserNavbarLinksProps {
  isMobile?: boolean
  onLinkClick?: () => void
}

export const UserNavbarLinks = ({ isMobile, onLinkClick }: UserNavbarLinksProps) => {
  const user = authUser()

  if (!user.isAuthenticated) return null

  // Tailles adaptées
  const iconSize = isMobile ? 24 : 18
  const textSize = isMobile ? 'lg' : 'sm'
  const rowGap = isMobile ? 'lg' : 'xl'
  const itemGap = isMobile ? 'sm' : 'xs'

  const dashboardIcon = <LuLayoutDashboard size={iconSize} />
  const addressBookIcon = <PiAddressBookBold size={iconSize} />
  const travelIcon = <RiMapPin2Line size={iconSize} />
  const documentIcon = <HiOutlineDocumentText size={iconSize} />

  const direction = isMobile ? 'column' : 'row'
  const align: 'flex-start' | 'center' = isMobile ? 'flex-start' : 'center'

  const handleClick = () => {
    onLinkClick?.()
  }

  const linkTextStyle = {
    color: 'var(--mantine-color-sand-12)',
    fontWeight: 600,
  } as const

  return (
    <Flex direction={direction} gap={rowGap} align={align} wrap="nowrap">
      <InternalLink route="/dashboard" onClick={handleClick}>
        <Group gap={itemGap} align="center">
          {dashboardIcon}
          <Text size={textSize} style={linkTextStyle}>
            Dashboard
          </Text>
        </Group>
      </InternalLink>

      <InternalLink route="/addresses" onClick={handleClick}>
        <Group gap={itemGap} align="center">
          {addressBookIcon}
          <Text size={textSize} style={linkTextStyle}>
            Carnet d&apos;adresses
          </Text>
        </Group>
      </InternalLink>

      <InternalLink route="/travels" onClick={handleClick}>
        <Group gap={itemGap} align="center">
          {travelIcon}
          <Text size={textSize} style={linkTextStyle}>
            Trajets
          </Text>
        </Group>
      </InternalLink>

      <InternalLink route="/travels/template-export" onClick={handleClick}>
        <Group gap={itemGap} align="center">
          {documentIcon}
          <Text size={textSize} style={linkTextStyle}>
            Justificatifs
          </Text>
        </Group>
      </InternalLink>
    </Flex>
  )
}
