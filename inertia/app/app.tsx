import '../css/app.css'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'

import dayjs from 'dayjs'
import 'dayjs/locale/fr'
dayjs.locale('fr')

import HomeLayout from '~/layouts/home_layout'

const appName = import.meta.env.VITE_APP_NAME || 'RoadMapp'

createInertiaApp({
  progress: { color: 'var(--app-gradient)', delay: 100 },
  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    const currentPage: any = await resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx')
    )
    currentPage.default.layout =
      currentPage.default.layout || ((p: any) => <HomeLayout children={p} />)
    return currentPage
  },

  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <MantineProvider defaultColorScheme="dark">
        <DatesProvider settings={{ locale: 'fr', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
          <App {...props} />
        </DatesProvider>
      </MantineProvider>
    )
  },
})
