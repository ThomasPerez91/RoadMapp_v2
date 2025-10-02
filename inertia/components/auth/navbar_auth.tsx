import { Group, Button, Avatar, Flex, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import authUser from '~/hooks/auth';
import { useAppDrawer } from '../drawer';
import { OAuth } from './oauth';
import { RiLogoutBoxRLine, RiLoginBoxLine, RiSettings3Line } from 'react-icons/ri';
import { LuLayoutDashboard } from 'react-icons/lu';
import { InternalLink } from '../links/internal_link';

interface NavbarAuthProps {
  isMobile?: boolean;
}

export const NavbarAuth = ({ isMobile }: NavbarAuthProps) => {
  const user = authUser();
  const { open } = useAppDrawer();
  const [menuOpened, menu] = useDisclosure(false);

  const loginIcon = <RiLoginBoxLine size={18} />;
  const logoutIcon = <RiLogoutBoxRLine size={18} />;
  const settingsIcon = <RiSettings3Line size={18} />;
  const dashboardIcon = <LuLayoutDashboard size={18} />;

  const direction = isMobile ? 'column' : 'row';
  const alignItems: 'flex-start' | 'flex-end' = isMobile ? 'flex-start' : 'flex-end';

  if (!user.isAuthenticated) {
    return (
      <Flex direction={direction} gap="xl" align={alignItems} wrap="nowrap" style={{ width: isMobile ? '100%' : 'auto' }}>
        <Button
          fullWidth={!!isMobile}
          rightSection={loginIcon}
          variant="gradient"
          gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
          onClick={() =>
            open({
              title: 'Connexion',
              content: <OAuth mode="login" />,
            })
          }
        >
          <b>Connexion</b>
        </Button>
      </Flex>
    );
  }

  // Authenticated
  return (
    <Group gap="lg" wrap="nowrap" justify={isMobile ? 'flex-start' : 'flex-end'} style={{ width: isMobile ? '100%' : 'auto' }}>
      <Flex direction="row" gap="md" wrap="nowrap" style={{ width: isMobile ? '100%' : 'auto' }}>
        <Button
          fullWidth={!!isMobile}
          rightSection={dashboardIcon}
          component={InternalLink}
          route="/dashboard"
          variant="gradient"
          gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
        >
          <b>Dashboard</b>
        </Button>

        <Button
          fullWidth={!!isMobile}
          rightSection={logoutIcon}
          component={InternalLink}
          route="/api/logout"
          variant="gradient"
          gradient={{ from: 'red', to: 'orange', deg: 90 }}
        >
          <b>Déconnexion</b>
        </Button>
      </Flex>

      {/* Avatar + menu (desktop seulement) */}
      {!isMobile && (
        <Menu
          opened={menuOpened}
          onChange={menu.toggle}
          position="bottom-end"
          width={220}
          shadow="md"
          radius="md"
          withinPortal
        >
          <Menu.Target>
            <Avatar
              src={user.user.avatarUrl}
              alt={user.user.name}
              radius="xl"
              size="md"
              component="button"
              style={{ cursor: 'pointer' }}
              title={user.user.name}
              onClick={menu.toggle}
            />
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{user.user.name}</Menu.Label>
            <Menu.Item
              leftSection={settingsIcon}
              component={InternalLink}
              route="/settings"
              onClick={menu.close}
            >
              Paramètres
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={logoutIcon}
              component={InternalLink}
              route="/api/logout"
              color="red"
              onClick={menu.close}
            >
              Déconnexion
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </Group>
  );
};
