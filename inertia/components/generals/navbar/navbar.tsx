import { Box, Burger, Drawer, Flex, Group, rem, Stack, useMantineTheme } from '@mantine/core'
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks'
import { useEffect } from 'react'
import classes from './navbar.module.css'
import { Logo } from '../logo/logo'
import { NavbarAuth } from '~/components/auth/navbar_auth'

interface NavbarProps {
  width: string
}

export function Navbar({ width }: NavbarProps) {
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
                <NavbarAuth />
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      </Box>
    </Stack>
  )
}
