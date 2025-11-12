import { Flex, Group, Title } from '@mantine/core'
import { InternalLink } from './internal_link'
import authUser from '~/hooks/auth'
import { LuLayoutDashboard } from 'react-icons/lu'
import { PiAddressBookBold } from 'react-icons/pi'
import { RiMapPin2Line } from 'react-icons/ri'

interface UserNavbarLinksProps {
  isMobile?: boolean
}

export const UserNavbarLinks = ({ isMobile }: UserNavbarLinksProps) => {
  const user = authUser()
  const dashboardIcon = <LuLayoutDashboard size={18} />
  const addressBookIcon = <PiAddressBookBold size={18} />
  const travelIcon = <RiMapPin2Line size={18} />
  const direction = isMobile ? 'column' : 'row'
  const align = isMobile ? 'left' : 'center'

  return (
    <>
      {user.isAuthenticated && (
        <Flex direction={direction} gap="xl" align={align} wrap="nowrap">
          <InternalLink
            route="/dashboard"
            children={
              <Group gap="xs" align="center">
                {dashboardIcon}
                <Title order={5} style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}>
                  Dashboard
                </Title>
              </Group>
            }
          />

          <InternalLink
            route="/addresses"
            children={
              <Group gap="xs" align="center">
                {addressBookIcon}
                <Title order={5} style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}>
                  Carnet d'adresses
                </Title>
              </Group>
            }
          />

          <InternalLink
            route="/travels"
            children={
              <Group gap="xs" align="center">
                {travelIcon}
                <Title order={5} style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}>
                  Trajets
                </Title>
              </Group>
            }
          />
        </Flex>
      )}
    </>
  )
}
