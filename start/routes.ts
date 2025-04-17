import router from '@adonisjs/core/services/router'

router.on('/').renderInertia('home')

router
  .get('/:provider/redirect', ({ ally, params }) => {
    ally.use(params.provider).redirect()
  })
  .where('provider', /github|google/)

router
  .get('/callback/:provider', async ({ ally, params }) => {
    try {
      const provider = params.provider
      if (!provider) {
        return 'Provider not found'
      } else {
        if (provider === 'github') {
          const gh = ally.use('github')

          if (gh.accessDenied()) {
            return 'You have cancelled the login process'
          }

          if (gh.stateMisMatch()) {
            return 'We are unable to verify the request. Please try again'
          }

          if (gh.hasError()) {
            return gh.getError()
          }

          const user = await gh.user()
          console.log(user)
          return user
        } else if (provider === 'google') {
          const google = ally.use('google')

          if (google.accessDenied()) {
            return 'You have cancelled the login process'
          }

          if (google.stateMisMatch()) {
            return 'We are unable to verify the request. Please try again'
          }

          if (google.hasError()) {
            return google.getError()
          }

          const user = await google.user()
          console.log(user)
          return user
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error)
      return 'An error occurred during authentication'
    }
  })
  .where('provider', /github|google/)
