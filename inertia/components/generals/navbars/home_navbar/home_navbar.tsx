import {
  Avatar,
  Button,
  Box,
  Burger,
  Drawer,
  Flex,
  Group,
  Menu,
  rem,
  Stack,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { Logo } from '../../logo/logo'
import authUser from '~/hooks/auth'
import { InternalLink } from '~/components/links/internal_link'
import { NavbarAuth } from '~/components/auth/navbar_auth'
import { UserNavbarLinks } from '~/components/links/user_navbar_links'
import { LuLayoutDashboard } from 'react-icons/lu'
import { RiLogoutBoxRLine, RiSettings3Line } from 'react-icons/ri'

interface NavbarProps {
  width: string
}

export const HomeNavbar = ({ width }: NavbarProps) => {
  const user = authUser()
  const theme = useMantineTheme()
  const [opened, handler] = useDisclosure(false)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)
  const pinned = useHeadroom({ fixedAt: 120 })

  // Hydratation: on force un rendu identique SSR + 1er rendu client
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (opened && !isMobile) handler.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

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
          overflow: 'hidden',
        }}
      >
        <Group
          justify="space-between"
          wrap="nowrap"
          style={{ width, maxWidth: '100%', marginInline: 'auto', height: '100%' }}
        >
          {/* Left: brand */}
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

          {/* Right (desktop) */}
          {!isMobile && (
            <Group justify="flex-end" gap="md" style={{ flex: 1 }}>
              {user.isAuthenticated ? (
                <>
                  <Button
                    component={InternalLink}
                    route="/dashboard"
                    rightSection={<LuLayoutDashboard size={18} />}
                    variant="gradient"
                    gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                  >
                    <b>Dashboard</b>
                  </Button>

                  {/* Avatar dropdown */}
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
                        src={isHydrated ? user.user.avatarUrl : undefined}
                        alt={user.user.name}
                        radius="xl"
                        size="md"
                        component="button"
                        style={{ cursor: 'pointer' }}
                        title={user.user.name}
                      >
                        {user.user.name?.[0]?.toUpperCase()}
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
                </>
              ) : (
                <NavbarAuth />
              )}
            </Group>
          )}
        </Group>

        {/* Mobile drawer */}
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
            },
            header: {
              background: 'transparent',
              borderBottom: '1px solid rgba(255,255,255,.06)',
            },
            body: {
              padding: 'var(--mantine-spacing-md)',
              height: `calc(100vh - ${isMobile ? rem(56) : rem(60)})`,
              display: 'flex',
              flexDirection: 'column',
            },
            overlay: { backdropFilter: 'blur(2px)' },
          }}
        >
          <Drawer.Overlay />
          <Drawer.Content>
            {/* Header compact */}
            <Drawer.Header>
              <Drawer.Title>
                <Title order={6} style={{ fontWeight: 700, color: 'var(--mantine-color-text)' }}>
                  Menu
                </Title>
              </Drawer.Title>
              <Drawer.CloseButton aria-label="Fermer le menu" />
            </Drawer.Header>

            <Drawer.Body>
              {/* Liens */}
              <Flex direction="column" gap="md">
                <UserNavbarLinks isMobile />
              </Flex>

              {/* Bas de drawer : avatar + logout */}
              {user.isAuthenticated && (
                <Flex
                  direction="row"
                  justify="space-between"
                  align="center"
                  gap="md"
                  mt="auto"
                  pt="md"
                  style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}
                >
                  <Avatar
                    src={isHydrated ? user.user.avatarUrl : undefined}
                    alt={user.user.name}
                    radius="xl"
                    size="lg"
                    title={user.user.name}
                  >
                    {user.user.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Button
                    component={InternalLink}
                    route="/api/logout"
                    variant="gradient"
                    gradient={{ from: 'plum', to: 'ocean', deg: 60 }}
                    rightSection={<RiLogoutBoxRLine size={18} />}
                  >
                    Déconnexion
                  </Button>
                </Flex>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      </Box>
    </Stack>
  )
}
