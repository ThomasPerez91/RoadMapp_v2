import { Box, rem } from '@mantine/core'
import { PropsWithChildren } from 'react'
import { BaseLayout } from './base_layout'
import { FlashMessages } from '~/components/flash_messages'
import { HomeNavbar } from '~/components/generals/navbars/home_navbar/home_navbar'

const HomeLayout = ({ children }: PropsWithChildren) => (
  <BaseLayout>
    <Layout>{children}</Layout>
  </BaseLayout>
)

export default HomeLayout

const LAYOUT_WIDTH = '1500px'
const Layout = ({ children }: PropsWithChildren) => (
  <>
    {/* Flash messages */}
    <FlashMessages />

    {/* Nav */}
    <HomeNavbar width={LAYOUT_WIDTH} />

    {/* Page content */}
    <Box
      style={{
        paddingInline: 'var(--mantine-spacing-lg)',
        flex: 1,
        backgroundImage: 'url(/bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      <Box
        style={{
          height: '100%',
          maxWidth: '100%',
          width: LAYOUT_WIDTH,
          marginInline: 'auto',
          marginBlock: rem(60),
        }}
      >
        {children}
      </Box>
    </Box>
  </>
)
