import { MantineProvider, ColorSchemeScript, Box, rem } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { PropsWithChildren } from 'react'
import { BaseLayout } from './base_layout'
import { UserNavbar } from '~/components/generals/navbars/user_navbar/user_navbar'

const LAYOUT_WIDTH = '1500px'

const UserLayout = ({ children }: PropsWithChildren) => (
  <MantineProvider defaultColorScheme="dark">
    {/* Important pour l’hydratation : rendu côté serveur ET client */}
    <ColorSchemeScript defaultColorScheme="dark" />
    <DatesProvider settings={{ locale: 'fr', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
      <BaseLayout>
        <UserNavbar width={LAYOUT_WIDTH} />

        <Box
          component="main"
          style={{
            paddingInline: 'var(--mantine-spacing-lg)',
            flex: 1,
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: rem(32),
          }}
        >
          <Box
            style={{
              height: '100%',
              width: '100%',
              maxWidth: LAYOUT_WIDTH,
              marginBlock: rem(40), // un peu moins pour compenser le paddingTop
            }}
          >
            {children}
          </Box>
        </Box>
      </BaseLayout>
    </DatesProvider>
  </MantineProvider>
)

export default UserLayout
