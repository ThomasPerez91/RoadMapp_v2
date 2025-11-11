import { Box, rem } from '@mantine/core'
import { PropsWithChildren } from 'react'
import { BaseLayout } from './base_layout'
import { UserNavbar } from '~/components/generals/navbars/user_navbar/user_navbar'

const LAYOUT_WIDTH = '1500px'

const UserLayout = ({ children }: PropsWithChildren) => (
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
        paddingTop: rem(60),
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
)

export default UserLayout
