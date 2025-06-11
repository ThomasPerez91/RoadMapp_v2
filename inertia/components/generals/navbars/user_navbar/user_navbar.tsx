import {
  Avatar,
  Box,
  Burger,
  Drawer,
  Flex,
  Group,
  rem,
  Stack,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks'
import { useEffect } from 'react'
import classes from './navbar.module.css'
import { Logo } from '../../logo/logo'
import { UserNavbarLinks } from '~/components/links/user_navbar_links'
import authUser from '~/hooks/auth'

interface NavbarProps {
  width: string
}

export const UserNavbar = ({ width }: NavbarProps) => {
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
        <Group className={classes.navbar__content} style={{ width }}>
          <Group>
            {isMobile && <Burger opened={opened} onClick={handler.toggle} />}
            <Logo size={60} />
            <span>
              <b>RoadMapp</b>
            </span>
          </Group>

          {!isMobile && (
            <>
              <Group>
                <UserNavbarLinks />
              </Group>
              <Group gap="xs">
                <Title order={5} style={{ color: 'var(--mantine-color-sand-12)', fontWeight: 600 }}>
                  {user.user.name}
                </Title>
                <Avatar src={user.user.avatarUrl} alt={user.user.name} radius="xl" size="md" />
              </Group>
            </>
          )}
        </Group>

        {/* Mobile drawer */}
        <Drawer.Root opened={opened} onClose={handler.close}>
          <Drawer.Overlay />
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                <Group>
                  <Logo size={40} />
                  <span>
                    <b>RoadMapp</b>
                  </span>
                </Group>
              </Drawer.Title>
              <Drawer.CloseButton />
            </Drawer.Header>
            <Drawer.Body>
              <Flex direction="column" gap="md">
                <UserNavbarLinks isMobile />
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      </Box>
    </Stack>
  )
}
