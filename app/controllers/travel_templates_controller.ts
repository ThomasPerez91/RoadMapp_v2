// app/controllers/travel_templates_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { buildTravelTemplate, generateTravelTemplatePdf } from '#services/travel_template'

export default class TravelTemplatesController {
  public async page({ inertia }: HttpContext) {
    return inertia.render('travels/template_export')
  }

  public async preview({ request, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const { from, to, detailed } = request.qs()

    if (!from || !to) {
      return response.badRequest({ message: 'Paramètres from/to manquants.' })
    }

    const template = await buildTravelTemplate(
      user.id,
      String(from),
      String(to),
      String(detailed) === '1'
    )

    return response.json(template)
  }

  public async exportPdf({ request, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const { from, to, detailed } = request.qs()

    if (!from || !to) {
      return response.badRequest('Paramètres from/to manquants.')
    }

    const detailedBool = String(detailed) === '1'

    const template = await buildTravelTemplate(user.id, String(from), String(to), detailedBool)

    const buffer = await generateTravelTemplatePdf(template, detailedBool)

    const filename = `trajets_${from}_${to}${detailedBool ? '_detail' : ''}.pdf`

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)

    return response.send(buffer)
  }
}
