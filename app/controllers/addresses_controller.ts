import Address from '#models/address'
import type { HttpContext } from '@adonisjs/core/http'
import { addressToDto } from '#dtos/address'
import { createAddressValidator, updateAddressValidator } from '#validators/address'

export default class AddressesController {
  /**
   * Display a list of addresses for the authenticated user
   */
  async index({ inertia, auth, request }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const page = request.input('page', 1)

    const addresses = await Address.query()
      .where('userId', user.id)
      .orderBy('name', 'asc')
      .paginate(page, 25)

    const { data, meta } = addresses.toJSON()
    const addressesDto = data.map((item) => addressToDto(item as Address))

    return inertia.render('addresses/index', { addresses: addressesDto, meta })
  }

  /**
   * Show the form to create a new address
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('addresses/create')
  }

  /**
   * Store a new address for the authenticated user
   */
  async store({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    try {
      const data = await request.validateUsing(createAddressValidator)
      const address = await Address.create({ ...data, userId: user.id })
      return response.created(addressToDto(address))
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }
  }

  /**
   * Show a specific address (only if owned by user)
   */
  async show({ params, auth, response, inertia }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const address = await Address.find(params.id)
    if (!address || address.userId !== user.id) {
      return response.unauthorized('Not allowed')
    }

    return inertia.render('addresses/show', { address: addressToDto(address) })
  }

  /**
   * Show form to edit an address
   */
  async edit({ params, auth, response, inertia }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const address = await Address.find(params.id)
    if (!address || address.userId !== user.id) {
      return response.unauthorized('Not allowed')
    }

    return inertia.render('addresses/edit', { address: addressToDto(address) })
  }

  /**
   * Update an address (only if owned by user)
   */
  async update({ params, request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    try {
      const address = await Address.find(params.id)
      if (!address || address.userId !== user.id) {
        return response.unauthorized('Not allowed')
      }

      const data = await request.validateUsing(updateAddressValidator)
      address.merge(data)
      await address.save()

      return response.ok(addressToDto(address))
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }
  }

  /**
   * Delete an address (only if owned by user)
   */
  async destroy({ params, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!
    try {
      const address = await Address.find(params.id)
      if (!address || address.userId !== user.id) {
        return response.unauthorized('Not allowed')
      }

      await address.delete()

      return response.noContent()
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }
  }

  /**
   * Search addresses for the authenticated user
   */
  async search({ request, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const query = request.input('q', '').trim()
    if (!query) {
      return []
    }

    const term = `%${query}%`

    const results = await Address.query()
      .where('userId', user.id)
      .andWhere((qb) => {
        qb.orWhereILike('name', term)
        qb.orWhereILike('address', term)
        qb.orWhereILike('city', term)
      })
      .limit(10)

    return results.map(addressToDto)
  }
}
