import {
  Avatar,
  Button,
  Box,
  Burger,
  Drawer,
  Flex,
  Group,
  rem,
  Stack,
  useMantineTheme,
  Title,
} from '@mantine/core'
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks'
import { useEffect } from 'react'
import classes from './navbar.module.css'
import { Logo } from '../../logo/logo'
import { NavbarAuth } from '~/components/auth/navbar_auth'
import authUser from '~/hooks/auth'
import { UserNavbarLinks } from '~/components/links/user_navbar_links'
import { InternalLink } from '~/components/links/internal_link'
import { RiLogoutBoxRLine } from 'react-icons/ri'

interface NavbarProps {
  width: string
}

export const HomeNavbar = ({ width }: NavbarProps) => {
  const user = authUser()
  const theme = useMantineTheme()
  const [opened, handler] = useDisclosure(false)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)
  const pinned = useHeadroom({ fixedAt: 120 })

  useEffect(() => {
    if (opened && !isMobile) {
      handler.close()
    }
  }, [isMobile])

  return (
    <Stack>
      <Box
        className={classes.navbar}
        style={{
          transform: `translate3d(0, ${pinned ? 0 : rem(-110)}, 0)`,
        }}
      >
        <Group className={!isMobile ? classes.navbar__content : ''} style={{ width }}>
          <Group>
            {isMobile && <Burger opened={opened} onClick={handler.toggle} />}
            <Logo size={60} />
            <span>
              <b>RoadMapp</b>
            </span>
          </Group>

          {!isMobile && (
            <Group>
              <NavbarAuth />
            </Group>
          )}
        </Group>

        {/* Mobile drawer */}
        <Drawer.Root opened={opened} onClose={handler.close}>
          <Drawer.Overlay />
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                <Flex align={'center'} justify={'space-between'}>
                  <Group>
                    <Logo size={40} />
                    <span>
                      <b>RoadMapp</b>
                    </span>
                  </Group>
                </Flex>
              </Drawer.Title>
              <Drawer.CloseButton />
            </Drawer.Header>
            <Drawer.Body className={classes.drawer__body}>
              <Flex direction="column" justify="space-between" gap="md" style={{ height: '99%' }}>
                {!user.isAuthenticated && <NavbarAuth isMobile />}
                <UserNavbarLinks isMobile />
                {user.isAuthenticated && (
                  <Flex direction="row" justify="space-between" align="center" gap="md">
                    <Group gap="md">
                      <Title
                        order={5}
                        style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}
                      >
                        {user.user.name}
                      </Title>
                      <Avatar
                        src={user.user.avatarUrl}
                        alt={user.user.name}
                        radius="xl"
                        size="md"
                      />
                    </Group>
                    <Button
                      component={InternalLink}
                      route="/api/logout"
                      variant="gradient"
                      gradient={{ from: 'red', to: 'orange', deg: 90 }}
                    >
                      <RiLogoutBoxRLine size={18} />
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      </Box>
    </Stack>
  )
}
