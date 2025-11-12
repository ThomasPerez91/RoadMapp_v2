import { MantineProvider, ColorSchemeScript, Box, rem } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { PropsWithChildren } from 'react'
import { BaseLayout } from './base_layout'
import { HomeNavbar } from '~/components/generals/navbars/home_navbar/home_navbar'

const LAYOUT_WIDTH = '1500px'

const HomeLayout = ({ children }: PropsWithChildren) => (
  <MantineProvider defaultColorScheme="dark">
    {/* Important pour l’hydratation : rendu côté serveur ET client */}
    <ColorSchemeScript defaultColorScheme="dark" />
    <DatesProvider settings={{ locale: 'fr', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
      <BaseLayout>
        <HomeNavbar width={LAYOUT_WIDTH} />

        <Box
          style={{
            flex: 1,
            minHeight: '100vh',
            paddingInline: 'var(--mantine-spacing-lg)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              width: '100%',
              maxWidth: LAYOUT_WIDTH,
              marginBlock: rem(60),
            }}
          >
            {children}
          </Box>
        </Box>
      </BaseLayout>
    </DatesProvider>
  </MantineProvider>
)

export default HomeLayout
