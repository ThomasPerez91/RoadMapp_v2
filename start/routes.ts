import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const AddressesController = () => import('#controllers/addresses_controller')
const TravelsController = () => import('#controllers/travels_controller')
const UsersController = () => import('#controllers/users_controller')
const MetricsController = () => import('#controllers/metrics_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const TravelTemplatesController = () => import('#controllers/travel_templates_controller')

router.on('/').renderInertia('home')

router
  .get('/api/:provider/redirect', [AuthController, 'redirect'])
  .where('provider', /github|google/)
router.get('/callback/:provider', [AuthController, 'callback']).where('provider', /github|google/)
router.get('/api/logout', [AuthController, 'logout'])

router.get('/addresses', [AddressesController, 'index']).middleware([middleware.auth()])

router
  .group(() => {
    router.post('/addresses', [AddressesController, 'store'])
    router.get('/addresses/search', [AddressesController, 'search'])
    router.put('/addresses/:id', [AddressesController, 'update'])
    router.delete('/addresses/:id', [AddressesController, 'destroy'])

    router.put('/user/profile', [UsersController, 'updateProfile'])

    router.get('/metrics', [MetricsController, 'show'])

    router.post('/travels', [TravelsController, 'store'])
    router.put('/travels/:id', [TravelsController, 'update'])
    router.delete('/travels/:id', [TravelsController, 'destroy'])

    router.get('/travels/template-export/preview', [TravelTemplatesController, 'preview'])
    router.get('/travels/template-export/pdf', [TravelTemplatesController, 'exportPdf'])
  })
  .prefix('/api')
  .middleware([middleware.auth()])

router
  .group(() => {
    router.get('/settings', [UsersController, 'settings'])

    router.get('/travels', [TravelsController, 'index'])
    router.get('/travels/create', [TravelsController, 'create'])
    router.get('/travels/:id/edit', [TravelsController, 'edit'])
    router.get('/travels/template-export', [TravelTemplatesController, 'page'])

    router.get('/dashboard', [DashboardController, 'index']).as('dashboard.index')
    router.get('/dashboard/stats', [DashboardController, 'stats']).as('dashboard.stats')
  })
  .middleware([middleware.auth()])
