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

      let user = await User.findBy('email', socialUser.email)

      // Si l'email existe déjà mais lié à un autre compte/provider
      if (user && user.oauth_id && user.oauth_id !== String(socialUser.id)) {
        return response.unauthorized(
          `This email is already linked to a different provider. Please use the correct one.`
        )
      }

      if (!user) {
        user = await User.create({
          oauth_id: socialUser.id,
          oauth_provider: provider,
          name: socialUser.name,
          nickname: socialUser.nickName,
          email: socialUser.email,
          email_verification: socialUser.emailVerificationState,
          avatar_url: socialUser.avatarUrl,
          token: socialUser.token.token,
          token_type: socialUser.token.type,
          expire_at: 'expire_at' in socialUser.token ? socialUser.token.expire_at : null,
          expire_in: 'expire_in' in socialUser.token ? socialUser.token.expire_in : null,
        })
      } else {
        user.merge({
          oauth_id: socialUser.id,
          oauth_provider: provider,
          email_verification: socialUser.emailVerificationState,
          token: socialUser.token.token,
          token_type: socialUser.token.type,
          expire_at: 'expire_at' in socialUser.token ? socialUser.token.expire_at : user.expire_at,
          expire_in: 'expire_in' in socialUser.token ? socialUser.token.expire_in : user.expire_in,
        })

        await user.save()
      }

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
