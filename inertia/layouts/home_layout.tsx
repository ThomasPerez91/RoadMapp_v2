// inertia/home_layout.tsx
import { Box, rem } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { BaseLayout } from './base_layout';
import { FlashMessages } from '~/components/flash_messages';
import { HomeNavbar } from '~/components/generals/navbars/home_navbar/home_navbar';

const LAYOUT_WIDTH = '1500px';

const HomeLayout = ({ children }: PropsWithChildren) => (
  <BaseLayout>
    <FlashMessages />
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
);

export default HomeLayout;
