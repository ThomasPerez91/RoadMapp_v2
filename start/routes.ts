import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')

router.on('/').renderInertia('home')

router
  .get('/api/:provider/redirect', [AuthController, 'redirect'])
  .where('provider', /github|google/)

router.get('/callback/:provider', [AuthController, 'callback']).where('provider', /github|google/)

router.get('/api/logout', [AuthController, 'logout'])
