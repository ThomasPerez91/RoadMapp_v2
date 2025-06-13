import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')

router.on('/').renderInertia('home')
router.on('/dashboard').renderInertia('users/dashboard').middleware([middleware.auth()]),

router.get('/api/:provider/redirect', [AuthController, 'redirect']).where('provider', /github|google/)
router.get('/callback/:provider', [AuthController, 'callback']).where('provider', /github|google/)

router.get('/api/logout', [AuthController, 'logout'])

router
  .resource('/api/addresses', () => import('#controllers/addresses_controller'))
  .middleware('*', [middleware.auth()])

router
  .get('/api/addresses/search', [() => import('#controllers/addresses_controller'), 'search'])
  .middleware([middleware.auth()])

router
  .resource('/api/travels', () => import('#controllers/travels_controller'))
  .only(['index'])
  .middleware('*', [middleware.auth()])
