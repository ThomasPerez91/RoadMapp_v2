// inertia/components/generals/navbars/user_navbar/user_navbar.tsx
import {
  Avatar,
  Box,
  Burger,
  Button,
  Drawer,
  Flex,
  Group,
  Menu,
  rem,
  Stack,
  Title,
  ActionIcon,
  useMantineTheme,
  Text,
} from '@mantine/core'
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { Logo } from '../../logo/logo'
import { UserNavbarLinks } from '~/components/links/user_navbar_links'
import authUser from '~/hooks/auth'
import { InternalLink } from '~/components/links/internal_link'
import { RiLogoutBoxRLine, RiSettings3Line, RiLoginBoxLine } from 'react-icons/ri'
import { useAppDrawer } from '~/components/drawer'
import { OAuth } from '~/components/auth/oauth'

interface NavbarProps {
  width: string
}

export const UserNavbar = ({ width }: NavbarProps) => {
  const user = authUser()
  const theme = useMantineTheme()
  const [opened, handler] = useDisclosure(false)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)
  const pinned = useHeadroom({ fixedAt: 120 })
  const { open } = useAppDrawer()

  // Hydratation : on force le même rendu SSR & premier rendu client
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (opened && !isMobile) handler.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const isLoggedIn = !!user?.user

  const openLoginDrawer = () =>
    open({
      title: 'Connexion',
      content: <OAuth mode="login" />,
    })

  return (
    <Stack gap={0}>
      <Box
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: isMobile ? rem(56) : rem(60),
          paddingInline: isMobile ? 'var(--mantine-spacing-md)' : 'var(--mantine-spacing-lg)',
          transition: 'transform 400ms ease',
          transform: `translate3d(0, ${pinned ? 0 : rem(-110)}, 0)`,
          background: 'linear-gradient(180deg, rgba(7,14,24,.85), rgba(7,14,24,.60))',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
        }}
      >
        {/* Layout grille: gauche (logo), centre (liens), droite (actions) */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            width,
            maxWidth: '100%',
            marginInline: 'auto',
            height: '100%',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
          {/* Colonne gauche: Logo + Burger (mobile) */}
          <Group gap="sm" wrap="nowrap">
            {isMobile && (
              <Burger
                opened={opened}
                onClick={handler.toggle}
                size="sm"
                aria-label="Ouvrir le menu"
              />
            )}
            <Logo size={isMobile ? 48 : 60} />
            <Title order={5} style={{ fontWeight: 700, color: 'var(--mantine-color-text)' }}>
              RoadMapp
            </Title>
          </Group>

          {/* Colonne centre: liens centrés (desktop seulement) */}
          {!isMobile && (
            <Group justify="center">
              <UserNavbarLinks />
            </Group>
          )}

          {/* Colonne droite: avatar / bouton connexion */}
          {!isMobile ? (
            <Group justify="flex-end">
              {isLoggedIn ? (
                <Menu
                  width={220}
                  position="bottom-end"
                  offset={6}
                  shadow="md"
                  radius="md"
                  withinPortal
                  styles={{
                    dropdown: {
                      background: 'linear-gradient(180deg, rgba(7,14,24,.92), rgba(7,14,24,.80))',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,.06)',
                    },
                  }}
                >
                  <Menu.Target>
                    <Avatar
                      src={isHydrated ? user.user!.avatarUrl : undefined}
                      alt={user.user!.name}
                      radius="xl"
                      size="md"
                      style={{ cursor: 'pointer' }}
                      title={user.user!.name}
                    >
                      {user.user!.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<RiSettings3Line size={16} />}
                      component={InternalLink}
                      route="/settings"
                    >
                      Paramètres
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<RiLogoutBoxRLine size={16} />}
                      component={InternalLink}
                      route="/api/logout"
                      color="red"
                    >
                      Déconnexion
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <Button
                  variant="gradient"
                  gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                  rightSection={<RiLoginBoxLine size={18} />}
                  onClick={openLoginDrawer}
                >
                  Connexion
                </Button>
              )}
            </Group>
          ) : (
            <Box /> // réserve l'espace à droite pour le grid en mobile
          )}
        </Box>

        {/* Drawer mobile (gauche) */}
        <Drawer.Root
          opened={opened}
          onClose={handler.close}
          position="left"
          size="100%"
          padding="md"
          withinPortal
          zIndex={4000}
          styles={{
            content: {
              backdropFilter: 'blur(8px)',
              background: 'rgba(7,14,24,.92)',
              borderLeft: 'none',
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              maxHeight: '100vh',
            },
            header: {
              background: 'transparent',
              borderBottom: '1px solid rgba(255,255,255,.06)',
            },
            body: {
              padding: 'var(--mantine-spacing-md)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            },
            overlay: { backdropFilter: 'blur(2px)' },
          }}
        >
          <Drawer.Overlay />
          <Drawer.Content>
            {/* Header compact */}
            <Drawer.Header>
              <Drawer.Title>
                {/* IMPORTANT : pas de <Title> Mantine ici pour éviter h6 dans h2 */}
                <Text fw={700}>Menu</Text>
              </Drawer.Title>
              <Drawer.CloseButton aria-label="Fermer le menu" />
            </Drawer.Header>

            <Drawer.Body>
              {/* Contenu central: liens (scrollable) */}
              <Box
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingBottom: rem(8),
                }}
              >
                {isLoggedIn ? <UserNavbarLinks isMobile onLinkClick={handler.close} /> : null}
              </Box>

              {/* Footer collé en bas */}
              {isLoggedIn ? (
                <Box
                  style={{
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    paddingTop: 'var(--mantine-spacing-md)',
                  }}
                >
                  <Flex direction="row" align="center" justify="space-between" gap="md">
                    {/* Avatar à gauche - un peu plus petit */}
                    <Avatar
                      src={isHydrated ? user.user!.avatarUrl : undefined}
                      alt={user.user!.name}
                      radius="xl"
                      size="md"
                      title={user.user!.name}
                      style={{
                        width: rem(36),
                        height: rem(36),
                        fontSize: rem(16),
                      }}
                    >
                      {user.user!.name?.[0]?.toUpperCase()}
                    </Avatar>

                    {/* Icônes à droite – plus grandes */}
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        radius="xl"
                        size="xl"
                        component={InternalLink}
                        route="/settings"
                        aria-label="Paramètres"
                        style={{
                          width: rem(40),
                          height: rem(40),
                        }}
                      >
                        <RiSettings3Line size={22} />
                      </ActionIcon>

                      <ActionIcon
                        variant="subtle"
                        radius="xl"
                        size="xl"
                        component={InternalLink}
                        route="/api/logout"
                        aria-label="Déconnexion"
                        style={{
                          width: rem(40),
                          height: rem(40),
                        }}
                      >
                        <RiLogoutBoxRLine size={22} />
                      </ActionIcon>
                    </Group>
                  </Flex>
                </Box>
              ) : (
                <Box
                  style={{
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    paddingTop: 'var(--mantine-spacing-md)',
                  }}
                >
                  <Button
                    mt="md"
                    fullWidth
                    variant="gradient"
                    gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                    rightSection={<RiLoginBoxLine size={18} />}
                    onClick={() => {
                      handler.close()
                      openLoginDrawer()
                    }}
                  >
                    Connexion
                  </Button>
                </Box>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      </Box>
    </Stack>
  )
}
