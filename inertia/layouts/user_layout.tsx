import { Box, rem } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { BaseLayout } from './base_layout';
import { FlashMessages } from '~/components/flash_messages';
import { UserNavbar } from '~/components/generals/navbars/user_navbar/user_navbar';

const LAYOUT_WIDTH = '1500px';

const UserLayout = ({ children }: PropsWithChildren) => (
  <BaseLayout>
    <FlashMessages />

    <UserNavbar width={LAYOUT_WIDTH} />

    {/* Page content (bg déjà géré par BaseLayout) */}
    <Box
      style={{
        paddingInline: 'var(--mantine-spacing-lg)',
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          height: '100%',
          width: '100%',
          maxWidth: LAYOUT_WIDTH,
          marginBlock: rem(60),
        }}
      >
        {children}
      </Box>
    </Box>
  </BaseLayout>
);

export default UserLayout;
