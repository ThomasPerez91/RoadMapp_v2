import { type HttpContext } from '@adonisjs/core/http'
import { AuthProviders } from '#enums/auth_providers'
import User from '#models/user'

export default class AuthController {
  public redirect({ ally, params }: HttpContext) {
    const provider = params.provider as AuthProviders

    if (!Object.values(AuthProviders).includes(provider)) {
      return `Provider ${provider} not found`
    }

    return ally.use(provider).redirect()
  }

  public async callback({ ally, params, response, auth }: HttpContext) {
    const provider = params.provider as AuthProviders

    if (!Object.values(AuthProviders).includes(provider)) {
      return response.badRequest('Provider not found')
    }

    const social = ally.use(provider)

    if (social.accessDenied()) {
      return response.unauthorized('You cancelled the login')
    }

    if (social.stateMisMatch()) {
      return response.badRequest('State mismatch – try again')
    }

    if (social.hasError()) {
      return response.badRequest(social.getError())
    }

    try {
      const socialUser = await social.user()

      const existingUser = await User.findBy('email', socialUser.email)

      if (existingUser && existingUser.oauthId !== String(socialUser.id)) {
        return response.unauthorized(
          `This email is already linked to a different provider. Please use the correct one.`
        )
      }

      const user = await User.updateOrCreate(
        { email: socialUser.email },
        {
          oauthId: socialUser.id,
          oauthProvider: provider,
          name: socialUser.name,
          nickname: socialUser.nickName,
          email: socialUser.email,
          emailVerification: socialUser.emailVerificationState,
          avatarUrl: socialUser.avatarUrl,
          token: socialUser.token.token,
          tokenType: socialUser.token.type,
          expireAt: 'expireAt' in socialUser.token ? socialUser.token.expireAt : null,
          expireIn: 'expireIn' in socialUser.token ? socialUser.token.expireIn : null,
        }
      )

      await auth.use('web').login(user)

      return response.redirect().toPath('/')
    } catch (error) {
      console.error('OAuth callback error:', error)
      return response.internalServerError('Something went wrong')
    }
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/')
  }
}
