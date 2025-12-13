// inertia/layouts/home_layout.tsx
import { MantineProvider, ColorSchemeScript, Box, rem, useMantineTheme } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { PropsWithChildren } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { BaseLayout } from './base_layout'
import { UserNavbar } from '~/components/generals/navbars/user_navbar/user_navbar'

const DESKTOP_WIDTH = '1500px'

const HomeLayoutInner = ({ children }: PropsWithChildren) => {
  const theme = useMantineTheme()
  const isTabletOrBelow = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`, false)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)

  return (
    <BaseLayout>
      <UserNavbar width={DESKTOP_WIDTH} />

      <Box
        style={{
          flex: 1,
          minHeight: '100vh',
          paddingInline: isMobile ? 'var(--mantine-spacing-md)' : 'var(--mantine-spacing-lg)',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Box
          style={{
            width: '100%',
            maxWidth: isTabletOrBelow ? '100%' : DESKTOP_WIDTH,
            marginBlock: isMobile ? rem(32) : rem(40),
          }}
        >
          {children}
        </Box>
      </Box>
    </BaseLayout>
  )
}

const HomeLayout = ({ children }: PropsWithChildren) => (
  <MantineProvider defaultColorScheme="dark">
    <ColorSchemeScript defaultColorScheme="dark" />

    <DatesProvider settings={{ locale: 'fr', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
      {/* MantineProvider est ICI → maintenant useMantineTheme() peut être appelé */}
      <HomeLayoutInner>{children}</HomeLayoutInner>
    </DatesProvider>
  </MantineProvider>
)

export default HomeLayout
