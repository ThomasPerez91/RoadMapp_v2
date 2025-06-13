import Travel from '#models/travel'
import type { HttpContext } from '@adonisjs/core/http'
import { travelToDto } from '#dtos/travel'

export default class TravelsController {
  public async index({ inertia, auth, request, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    try {
      const page = request.input('page', 1)

      const travels = await Travel.query()
        .where('userId', user.id)
        .orderBy('date', 'desc')
        .paginate(page, 25)

      const { data, meta } = travels.toJSON()
      const travelsDto = data.map(travelToDto)

      return inertia.render('travels/index', { travels: travelsDto, meta })
    } catch (error) {
      console.error(error)
      return response.internalServerError({ message: (error as Error).message })
    }
  }
}
