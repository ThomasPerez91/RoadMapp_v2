import Address from '#models/address'
import type { HttpContext } from '@adonisjs/core/http'
import { addressToDto } from '#dtos/address'
import { createAddressValidator, updateAddressValidator } from '#validators/address'

export default class AddressesController {
  /**
   * Liste pour la page Inertia
   */
  async index({ inertia, auth, request }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const page = Number(request.input('page', 1))
    const status = request.input('status', 'active') as 'active' | 'archived'

    const query = Address.query().where('userId', user.id).andWhere('isHome', false)

    if (status === 'active') {
      query.where('isActive', true)
    } else if (status === 'archived') {
      query.where('isActive', false)
    }

    const addresses = await query.orderBy('name', 'asc').paginate(page, 10)
    const { data, meta } = addresses.toJSON()
    const addressesDto = (data as any[]).map((item) => addressToDto(item as Address))

    return inertia.render('addresses/index', { addresses: addressesDto, meta, status })
  }

  /**
   * Création (API JSON)
   */
  async store({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    try {
      const payload = await request.validateUsing(createAddressValidator)

      if (payload.is_home === true) {
        await Address.query()
          .where('userId', user.id)
          .andWhere('isHome', true)
          // 👉 colonne camelCase : isActive
          .update({ isHome: false, isActive: true })
      }

      const address = await Address.create({
        name: payload.name,
        address: payload.address,
        postalCode: payload.postal_code,
        city: payload.city,
        isHome: payload.is_home ?? false,
        isActive: payload.is_active ?? true,
        checked: payload.checked ?? false,
        used: false,
        userId: user.id,
      })

      return response.created(addressToDto(address))
    } catch (error) {
      console.log("Erreur lors de la création de l'adresse :", error)
      return response.badRequest({ message: (error as Error).message })
    }
  }

  async update({ params, request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    try {
      const address = await Address.find(params.id)
      if (!address || address.userId !== user.id) {
        return response.unauthorized('Not allowed')
      }

      const payload = await request.validateUsing(updateAddressValidator)

      const nextValues = {
        name: payload.name,
        address: payload.address,
        postalCode: payload.postal_code,
        city: payload.city,
        isHome: payload.is_home ?? address.isHome,
        isActive: payload.is_active ?? address.isActive,
        checked: payload.checked ?? address.checked,
      }

      if (address.used) {
        const sameAddress = nextValues.address === address.address
        const samePostal = nextValues.postalCode === address.postalCode
        const sameCity = nextValues.city === address.city

        if (!sameAddress || !samePostal || !sameCity) {
          return response.badRequest({
            message: 'Cette adresse est utilisée dans un trajet : seul le nom peut être modifié.',
          })
        }
      }

      address.merge(nextValues)
      await address.save()

      return response.ok(addressToDto(address))
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }
  }

  /**
   * Suppression (interdite si used = true)
   */
  async destroy({ params, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    try {
      const address = await Address.find(params.id)
      if (!address || address.userId !== user.id) {
        return response.unauthorized('Not allowed')
      }

      if (address.used) {
        return response.badRequest({
          message: 'Impossible de supprimer une adresse utilisée dans un trajet.',
        })
      }

      await address.delete()
      return response.noContent()
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }
  }

  /**
   * Recherche dynamique
   * GET /api/addresses/search?q=...&active=true|false
   * -> dès la 1ère lettre, filtre les noms/adresses/villes commençant par ce préfixe
   */
  async search({ request, auth }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const q = (request.input('q', '') as string).trim()
    if (!q) return []

    const activeParam = request.input('active') // "true" | "false" | undefined

    const prefix = `${q}%`

    const query = Address.query()
      .where('userId', user.id)
      .andWhere('isHome', false) // 👉 on exclut aussi l’adresse de départ ici
      .andWhere((qb) => {
        qb.orWhereILike('name', prefix)
        qb.orWhereILike('address', prefix)
        qb.orWhereILike('city', prefix)
      })
      .orderBy('name', 'asc')
      .limit(20)

    if (activeParam === 'true') {
      query.where('isActive', true)
    } else if (activeParam === 'false') {
      query.where('isActive', false)
    }

    const results = await query

    return results.map(addressToDto)
  }
}
