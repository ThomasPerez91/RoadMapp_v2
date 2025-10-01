import { ColorSchemeScript, MantineProvider, Global } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { AppDrawerProvider } from '~/components/drawer';
import theme from './theme';

interface BaseLayoutProps extends PropsWithChildren {
  forceColorScheme?: 'dark' | 'light';
}

export function BaseLayout({ children, forceColorScheme }: BaseLayoutProps) {
  return (
    <>
      <ColorSchemeScript
        defaultColorScheme="dark"
        forceColorScheme={forceColorScheme}
      />

      <MantineProvider
        theme={theme}
        withCssVariables
        defaultColorScheme="dark"
        forceColorScheme={forceColorScheme}
      >
        <Global
          styles={{
            'html, body, #app': { height: '100%' },
            body: {
              margin: 0,
              backgroundColor: '#070e18',
              backgroundImage: 'url(/bg.webp)', // place bg.webp dans /public
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              backgroundSize: 'cover',
              color: '#e6f0ff',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            },
          }}
        />
        <AppDrawerProvider>{children}</AppDrawerProvider>
      </MantineProvider>
    </>
  );
}

export default BaseLayout;
