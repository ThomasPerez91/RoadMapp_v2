import { ColorSchemeScript, createTheme, MantineProvider, rem } from '@mantine/core'
import { PropsWithChildren } from 'react'
import { AppDrawerProvider } from '~/components/drawer'

const PRIMARY_COLOR = '#3f88c5' // TODO: change primary color

const customTheme = createTheme({
  colors: {
    blue: [
      '#e7f5ff',
      '#d0ebff',
      '#a5d8ff',
      '#74c0fc',
      '#4dabf7',
      PRIMARY_COLOR,
      '#228be6',
      '#1c7ed6',
      '#1971c2',
      '#1864ab',
    ],
  },
  primaryColor: 'blue',
  fontFamily: 'Poppins, sans-serif',
  respectReducedMotion: true,
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: '400',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: '500',
        },
      },
    },
  },
  headings: {
    fontWeight: '400',

    sizes: {
      h1: {
        fontSize: rem(36),
        lineHeight: '1.4',
      },
      h2: { fontSize: rem(30), lineHeight: '1.2' },
      h3: { fontSize: rem(24), lineHeight: '1.2' },
      h4: { fontSize: rem(20), lineHeight: '1.2' },
      h5: { fontSize: rem(16), lineHeight: '1.2' },
      h6: { fontSize: rem(12), lineHeight: '1.2' },
    },
  },
})

interface BaseLayoutProps extends PropsWithChildren {
  forceColorScheme?: 'dark' | 'light'
}

export function BaseLayout({ children, forceColorScheme = undefined }: BaseLayoutProps) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" forceColorScheme={forceColorScheme} />
      <MantineProvider
        theme={customTheme}
        defaultColorScheme="dark"
        forceColorScheme={forceColorScheme}
      >
        <AppDrawerProvider>{children}</AppDrawerProvider>
      </MantineProvider>
    </>
  )
}
