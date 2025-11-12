// app/controllers/users_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'
import { addressToDto } from '#dtos/address'
import { updateUserProfileValidator } from '#validators/user'
import { userToDto, type UserDto } from '#dtos/user'

export default class UsersController {
  /**
   * Page de paramètres (Inertia)
   */
  async settings({ inertia, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const homeAddress = await Address.query()
      .where('userId', user.id)
      .andWhere('isHome', true)
      .first()

    return inertia.render('users/settings', {
      user: userToDto(user), // 👈 snapshot stable pour la page
      homeAddress: homeAddress ? addressToDto(homeAddress) : null,
    })
  }

  /**
   * Update profil (API JSON)
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const payload = await request.validateUsing(updateUserProfileValidator)

    user.name = payload.name

    // on met bien à jour la bonne colonne (avatar_url)
    if ('avatar_url' in payload) {
      user.avatar_url = payload.avatar_url?.trim() || ''
    }

    await user.save()

    const dto: UserDto = userToDto(user)

    return response.ok({ user: dto })
  }
}
