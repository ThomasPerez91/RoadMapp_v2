import { Group, Button, Avatar, Title } from '@mantine/core'
import authUser from '~/hooks/auth'
import { useAppDrawer } from '../drawer'
import { OAuth } from './oauth'
import { RiLogoutBoxRLine, RiLoginBoxLine } from 'react-icons/ri'
import { LuLayoutDashboard } from 'react-icons/lu'
import { InternalLink } from '../links/internal_link'

export const NavbarAuth = () => {
  const user = authUser()
  const { open } = useAppDrawer()
  const loginIcon = <RiLoginBoxLine size={18} />
  const logoutIcon = <RiLogoutBoxRLine size={18} />
  const dashboardIcon = <LuLayoutDashboard size={18} />

  return (
    <>
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
          <Group gap="xs">
            <Title order={5} style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}>
              {user.user.name}
            </Title>
            <Avatar src={user.user.avatarUrl} alt={user.user.name} radius="xl" size="md" />
          </Group>
          <Group gap="xs">
            <Button
              rightSection={dashboardIcon}
              component={InternalLink}
              route="/api/dashboard"
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
          </Group>
        </Group>
      )}
    </>
  )
}
