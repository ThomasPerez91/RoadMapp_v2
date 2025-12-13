// inertia/layouts/user_layout.tsx
import { MantineProvider, ColorSchemeScript, Box, rem, useMantineTheme } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { PropsWithChildren } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { BaseLayout } from './base_layout'
import { UserNavbar } from '~/components/generals/navbars/user_navbar/user_navbar'

const LAYOUT_WIDTH = '1500px'

const UserLayoutInner = ({ children }: PropsWithChildren) => {
  const theme = useMantineTheme()
  const isTabletOrBelow = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`, false)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)

  return (
    <BaseLayout>
      <UserNavbar width={LAYOUT_WIDTH} />

      <Box
        component="main"
        style={{
          paddingInline: isMobile ? 'var(--mantine-spacing-md)' : 'var(--mantine-spacing-lg)',
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: rem(32),
          width: '100%',
          overflowX: 'hidden', // empêche le scroll horizontal qui décale le drawer
        }}
      >
        <Box
          style={{
            height: '100%',
            width: '100%',
            maxWidth: isTabletOrBelow ? '100%' : LAYOUT_WIDTH,
            marginBlock: isMobile ? rem(24) : rem(40),
          }}
        >
          {children}
        </Box>
      </Box>
    </BaseLayout>
  )
}

const UserLayout = ({ children }: PropsWithChildren) => (
  <MantineProvider defaultColorScheme="dark">
    <ColorSchemeScript defaultColorScheme="dark" />
    <DatesProvider settings={{ locale: 'fr', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
      {/* Ici, on est sous MantineProvider → useMantineTheme est OK */}
      <UserLayoutInner>{children}</UserLayoutInner>
    </DatesProvider>
  </MantineProvider>
)

export default UserLayout
