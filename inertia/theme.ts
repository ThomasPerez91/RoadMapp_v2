// inertia/theme.ts
import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

const ocean: MantineColorsTuple = [
  '#e6faff',
  '#c8f1ff',
  '#a6e6ff',
  '#7bd9ff',
  '#51ccff',
  '#38b7ee',
  '#2895c4',
  '#1d7599',
  '#155974',
  '#0d3a4c',
];

const plum: MantineColorsTuple = [
  '#fbebff',
  '#f3d1ff',
  '#e7a9ff',
  '#d97eff',
  '#ca57ff',
  '#b43ef0',
  '#912ec3',
  '#6f2396',
  '#50196d',
  '#330f45',
];

const theme = createTheme({
  /** Sombre par défaut */
  defaultColorScheme: 'dark',

  /** Couleur principale + palettes custom */
  primaryColor: 'ocean',
  colors: { ocean, plum },

  /** Tokens modernes */
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
  headings: { fontFamily: 'Inter, ui-sans-serif, system-ui' },
  defaultRadius: 'lg',
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,.35)',
    md: '0 8px 24px rgba(0,0,0,.35)',
  },
  spacing: { xs: rem(8), sm: rem(12), md: rem(16), lg: rem(24), xl: rem(32) },
  focusRing: 'auto',
  luminanceThreshold: 0.25, // contraste meilleur en dark

  /** Overrides de composants */
  components: {
    Button: {
      defaultProps: { size: 'md', radius: 'xl' },
      styles: (t, { variant }) => ({
        root: {
          fontWeight: 600,
          letterSpacing: '.2px',
          transition: 'transform .06s ease, box-shadow .2s ease',
          ...(variant === 'filled' && {
            boxShadow: '0 10px 30px rgba(56,183,238,.25)',
          }),
          '&:active': { transform: 'translateY(1px)' },
        },
      }),
    },

    Paper: {
      defaultProps: { radius: 'xl', p: 'lg' },
      styles: {
        root: {
          backdropFilter: 'blur(6px)',
          background: 'rgba(10, 17, 27, 0.6)',
          border: '1px solid rgba(255,255,255,.06)',
        },
      },
    },

    Card: {
      defaultProps: { radius: 'xl', p: 'lg', withBorder: false },
      styles: {
        root: {
          backdropFilter: 'blur(6px)',
          background: 'rgba(10, 17, 27, 0.55)',
          border: '1px solid rgba(255,255,255,.06)',
        },
      },
    },

    AppShell: {
      styles: {
        header: {
          backdropFilter: 'blur(8px)',
          background:
            'linear-gradient(180deg, rgba(7,14,24,.85), rgba(7,14,24,.65))',
          borderBottom: '1px solid rgba(255,255,255,.06)',
        },
        navbar: {
          backdropFilter: 'blur(6px)',
          background: 'rgba(7,14,24,.75)',
          borderRight: '1px solid rgba(255,255,255,.06)',
        },
        main: {
          paddingTop: rem(16), // évite qu’un header fixe masque le contenu
        },
      },
    },

    // Champs de formulaire
    TextInput: {
      defaultProps: { radius: 'md', size: 'md' },
      styles: {
        input: {
          background: 'rgba(255,255,255,.04)',
          borderColor: 'rgba(255,255,255,.08)',
          '&:focus': { borderColor: 'var(--mantine-color-ocean-5)' },
        },
      },
    },
    PasswordInput: { defaultProps: { radius: 'md', size: 'md' } },
    NumberInput: { defaultProps: { radius: 'md', size: 'md' } },
    Select: { defaultProps: { radius: 'md', size: 'md' } },
    Textarea: { defaultProps: { radius: 'md', autosize: true } },

    Badge: {
      defaultProps: { radius: 'xl' },
    },

    Tabs: {
      styles: {
        tab: {
          borderRadius: 999,
          '&[data-active]': {
            background: 'rgba(56,183,238,.15)',
            borderColor: 'transparent',
          },
        },
        list: {
          borderBottomColor: 'rgba(255,255,255,.08)',
        },
      },
    },
  },
});

export default theme;
export { theme };
