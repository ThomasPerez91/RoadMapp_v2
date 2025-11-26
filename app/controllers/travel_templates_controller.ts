// app/controllers/travel_templates_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import {
  buildTravelTemplate,
  generateTravelTemplateExcel,
  generateTravelTemplatePdf,
} from '#services/travel_template'

export default class TravelTemplatesController {
  async page({ inertia, auth }: HttpContext) {
    await auth.check()
    return inertia.render('travels/template_export', {})
  }

  private parseDetailed(request: HttpContext['request']): boolean {
    const raw = request.input('detailed')
    return raw === 'true' || raw === '1' || raw === 1 || raw === true
  }

  async preview({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const fromStr = request.input('from')
    const toStr = request.input('to')
    const detailed = this.parseDetailed(request)

    if (!fromStr || !toStr) {
      return response.badRequest({ message: 'Les paramètres from/to sont obligatoires' })
    }

    try {
      const template = await buildTravelTemplate(user.id, fromStr, toStr, detailed)
      return response.ok(template)
    } catch {
      return response.badRequest({
        message: 'La période fournie est invalide.',
      })
    }
  }

  async exportExcel({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const fromStr = request.input('from')
    const toStr = request.input('to')
    const detailed = this.parseDetailed(request)

    if (!fromStr || !toStr) {
      return response.badRequest({ message: 'Les paramètres from/to sont obligatoires' })
    }

    const template = await buildTravelTemplate(user.id, fromStr, toStr, detailed)
    const buffer = await generateTravelTemplateExcel(template, detailed)

    response.header(
      'Content-Disposition',
      `attachment; filename="trajets_${template.from}_${template.to}${
        detailed ? '_detail' : '_recap'
      }.xlsx"`
    )
    response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    return response.send(buffer)
  }

  async exportPdf({ request, auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user!

    const fromStr = request.input('from')
    const toStr = request.input('to')
    const detailed = this.parseDetailed(request)

    if (!fromStr || !toStr) {
      return response.badRequest({ message: 'Les paramètres from/to sont obligatoires' })
    }

    const template = await buildTravelTemplate(user.id, fromStr, toStr, detailed)
    const buffer = await generateTravelTemplatePdf(template, detailed)

    response.header(
      'Content-Disposition',
      `attachment; filename="trajets_${template.from}_${template.to}${
        detailed ? '_detail' : '_recap'
      }.pdf"`
    )
    response.header('Content-Type', 'application/pdf')

    return response.send(buffer)
  }
}
