import Address from '#models/address'
import type { HttpContext } from '@adonisjs/core/http'

export default class AddressesController {
  /**
   * Display a list of addresses for the authenticated user
   */
  async index({ inertia, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const addresses = await Address.query().where('userId', user.id).orderBy('name', 'asc')

    return inertia.render('addresses/index', { addresses })
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

    const data = request.only(['name', 'address', 'postalCode', 'city', 'isHome']) // adapte ici

    await Address.create({ ...data, userId: user.id })

    return response.redirect().toPath('/addresses/index')
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

    return inertia.render('addresses/show', { address })
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

    return inertia.render('addresses/edit', { address })
  }

  /**
   * Update an address (only if owned by user)
   */
  async update({ params, request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const address = await Address.find(params.id)
    if (!address || address.userId !== user.id) {
      return response.unauthorized('Not allowed')
    }

    const data = request.only(['street', 'city', 'zip', 'country']) // adapte ici
    address.merge(data)
    await address.save()

    return response.redirect().toPath('/addresses')
  }

  /**
   * Delete an address (only if owned by user)
   */
  async destroy({ params, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const address = await Address.find(params.id)
    if (!address || address.userId !== user.id) {
      return response.unauthorized('Not allowed')
    }

    await address.delete()

    return response.redirect().toPath('/addresses')
  }
}
