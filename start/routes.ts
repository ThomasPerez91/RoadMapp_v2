import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')

router.on('/').renderInertia('home')
router.on('/dashboard').renderInertia('users/dashboard').middleware([middleware.auth()]),

router.get('/api/:provider/redirect', [AuthController, 'redirect']).where('provider', /github|google/)
router.get('/callback/:provider', [AuthController, 'callback']).where('provider', /github|google/)

router.get('/api/logout', [AuthController, 'logout'])
