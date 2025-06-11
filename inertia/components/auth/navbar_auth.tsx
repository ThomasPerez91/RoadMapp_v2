
import { Group, Button, Avatar, Flex } from '@mantine/core'
import authUser from '~/hooks/auth'
import { useAppDrawer } from '../drawer'
import { OAuth } from './oauth'
import { RiLogoutBoxRLine, RiLoginBoxLine } from 'react-icons/ri'
import { LuLayoutDashboard } from 'react-icons/lu'
import { InternalLink } from '../links/internal_link'

interface NavbarAuthProps {
  isMobile?: boolean
}

export const NavbarAuth = ({ isMobile }: NavbarAuthProps) => {
  const user = authUser()
  const { open } = useAppDrawer()
  const loginIcon = <RiLoginBoxLine size={18} />
  const logoutIcon = <RiLogoutBoxRLine size={18} />
  const dashboardIcon = <LuLayoutDashboard size={18} />
  const direction = isMobile ? 'column' : 'row'
  const align = isMobile ? 'left' : 'right'

  return (
    <Flex direction={direction} gap="xl" align={align} wrap="nowrap">
      {!user.isAuthenticated && (
        <Button
          rightSection={loginIcon}
          variant="gradient"
          gradient={{ from: 'cyan', to: 'teal', deg: 90 }}
          onClick={() =>
            open({
              title: 'Connexion',
              content: <OAuth mode="login" />,
            })
          }
        >
          <b>Connexion</b>
        </Button>
      )}

      {user.isAuthenticated && (
        <Group gap="lg">
          <Flex direction="row" gap="md">
            <Button
              rightSection={dashboardIcon}
              component={InternalLink}
              route="/dashboard"
              variant="gradient"
              gradient={{ from: 'cyan', to: 'teal', deg: 90 }}
            >
              <b>Dashboard</b>
            </Button>
            <Button
              rightSection={logoutIcon}
              component={InternalLink}
              route="/api/logout"
              variant="gradient"
              gradient={{ from: 'red', to: 'orange', deg: 90 }}
            >
              <b>Déconnexion</b>
            </Button>
          </Flex>
          {!isMobile && (
            <Avatar
              component="button"
              onClick={() =>
                open({
                  title: 'Connexion',
                  content: <OAuth mode="login" />,
                })
              }
              src={user.user.avatarUrl}
              alt={user.user.name}
              radius="xl"
              size="md"
            />
          )}
        </Group>
      )}
    </Flex>
  )
}
