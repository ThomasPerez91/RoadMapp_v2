// app/services/travel_template.ts
import { DateTime } from 'luxon'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import { join } from 'node:path'

import Travel from '#models/travel'
import Leg from '#models/leg'
import Address from '#models/address'
import type { TravelDto } from '#dtos/travel'
import { travelToDto } from '#dtos/travel'

export interface TravelTemplateLeg {
  distanceToString: string
  fromAddressText: string
  toAddressText: string
}

export interface TravelTemplateRow {
  id: number
  date: string
  distanceToString: string
  distanceKm: number
  stepsCount: number
  legs?: TravelTemplateLeg[]
}

export interface TravelTemplate {
  from: string
  to: string
  totalKm: number
  totalSteps: number
  rows: TravelTemplateRow[]
}

function kmFromMeters(meters: number): number {
  if (!meters) return 0
  const km = meters / 1000
  return Math.round(km * 10) / 10
}

function formatAddress(addr: Address | null): string {
  if (!addr) return ''
  const line1 = addr.address || ''
  const line2 = [addr.postalCode, addr.city].filter(Boolean).join(' ')
  return [line1, line2].filter(Boolean).join('\n')
}

function formatDateFr(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('fr-FR')
}

// espace fine insécable / insécable -> espace normal
const NBSP_REGEX = /\u202F|\u00A0/g

function formatKmLabel(value: number): string {
  const formatted = value.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const cleaned = formatted.replace(NBSP_REGEX, ' ')
  return `${cleaned} km`
}

/**
 * Construit les lignes + totaux
 * Option B : total = somme des valeurs affichées (distanceKm), pas la somme exacte BDD.
 */
export async function buildTravelTemplate(
  userId: number,
  fromStr: string,
  toStr: string,
  detailed: boolean
): Promise<TravelTemplate> {
  const from = DateTime.fromISO(fromStr).startOf('day')
  const to = DateTime.fromISO(toStr).endOf('day')

  if (!from.isValid || !to.isValid || from > to) {
    throw new Error('Invalid date range')
  }

  // ---------- Récup des trajets pour construire les lignes ----------
  const travels = await Travel.query()
    .where('user_id', userId)
    .andWhere('date', '>=', from.toJSDate())
    .andWhere('date', '<=', to.toJSDate())
    .withCount('legs', (q) => q.as('step_count'))
    .orderBy('date', 'asc')

  const dtos: TravelDto[] = travels.map(travelToDto)

  const rows: TravelTemplateRow[] = dtos.map((t) => {
    const distanceKm = kmFromMeters(t.distance)
    const stepsCount = Number(t.stepsCount ?? 0) // 🔥 cast en number ICI
    return {
      id: t.id,
      date: t.date,
      distanceToString: t.distanceToString,
      distanceKm,
      stepsCount,
    }
  })

  // ---------- Totaux basés sur les valeurs affichées ----------
  // stepsCount est maintenant un number, la somme reste numérique
  const totalKm = rows.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalSteps = rows.reduce((sum, r) => sum + r.stepsCount, 0)

  // ---------- Legs détaillés ----------
  if (detailed && rows.length > 0) {
    const travelIds = rows.map((r) => r.id)

    const legs = await Leg.query()
      .whereIn('travel_id', travelIds)
      .preload('startAddress')
      .preload('endAddress')
      .orderBy('id', 'asc')

    const legsByTravelId: Record<number, TravelTemplateLeg[]> = {}

    for (const leg of legs) {
      const travelId = leg.travelId
      if (!legsByTravelId[travelId]) legsByTravelId[travelId] = []

      legsByTravelId[travelId].push({
        distanceToString: leg.distanceToString,
        fromAddressText: formatAddress(leg.startAddress),
        toAddressText: formatAddress(leg.endAddress),
      })
    }

    for (const row of rows) {
      if (legsByTravelId[row.id]) {
        row.legs = legsByTravelId[row.id]
      }
    }
  }

  return {
    from: from.toISODate(),
    to: to.toISODate(),
    totalKm,
    totalSteps,
    rows,
  }
}

/**
 * EXCEL
 */
export async function generateTravelTemplateExcel(
  template: TravelTemplate,
  detailed: boolean
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Trajets')

  sheet.mergeCells('A1', detailed ? 'E1' : 'C1')
  sheet.getCell('A1').value = 'ROADMAPP'
  sheet.getCell('A1').font = { bold: true, size: 18 }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('A2', detailed ? 'E2' : 'C2')
  sheet.getCell('A2').value = 'HISTORIQUE DES TRAJETS DU'
  sheet.getCell('A2').font = { bold: true, size: 12 }
  sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('A3', detailed ? 'E3' : 'C3')
  sheet.getCell('A3').value = `DU ${formatDateFr(template.from)} AU ${formatDateFr(template.to)}`
  sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.addRow([])
  sheet.addRow([])

  if (!detailed) {
    // ---- RÉCAP ----
    sheet.columns = [
      { header: 'DATE', key: 'date', width: 14 },
      { header: 'ETAPES', key: 'steps', width: 10 },
      { header: 'DISTANCE', key: 'distance', width: 18 },
    ]

    const headerRow = sheet.addRow(['DATE', 'ETAPES', 'DISTANCE'])
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

    for (const row of template.rows) {
      const r = sheet.addRow([formatDateFr(row.date), row.stepsCount ?? 0, row.distanceToString])
      r.alignment = { horizontal: 'center', vertical: 'middle' }
    }

    const totalKmLabel: string = formatKmLabel(template.totalKm)

    const totalRow = sheet.addRow(['TOTAL', template.totalSteps, totalKmLabel])
    totalRow.font = { bold: true }
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' }
  } else {
    // ---- DÉTAILLÉ ----
    sheet.columns = [
      { header: 'DATE', key: 'date', width: 14 },
      { header: 'ETAPES', key: 'steps', width: 10 },
      { header: 'DISTANCE', key: 'distance', width: 18 },
      { header: 'DEPART', key: 'from', width: 35 },
      { header: 'ARRIVEE', key: 'to', width: 35 },
    ]

    const headerRow = sheet.addRow(['DATE', 'ETAPES', 'DISTANCE', 'DEPART', 'ARRIVEE'])
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

    for (const row of template.rows) {
      const main = sheet.addRow([
        formatDateFr(row.date),
        row.stepsCount ?? 0,
        row.distanceToString,
        '',
        '',
      ])
      main.font = { bold: true }
      main.alignment = { horizontal: 'center', vertical: 'middle' }

      if (row.legs && row.legs.length) {
        row.legs.forEach((leg, index) => {
          const r = sheet.addRow([
            '',
            index + 1,
            leg.distanceToString,
            leg.fromAddressText,
            leg.toAddressText,
          ])
          // adresses lisibles : align top en Excel
          r.alignment = { vertical: 'top' }
        })
      }

      sheet.addRow([])
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer as ArrayBuffer)
}

/**
 * PDF
 * detailed = false → tableau récap seul
 * detailed = true  → tableau détaillé + totaux par mois + total période
 */
export async function generateTravelTemplatePdf(
  template: TravelTemplate,
  detailed: boolean
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 60 })

  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const leftMargin = 60
    const rightMargin = pageWidth - 60
    const usableWidth = rightMargin - leftMargin
    const padding = 4
    const headerBg = '#e5e7eb'
    const totalBg = '#374151'
    const pageBottom = doc.page.height - 60

    const ensurePage = (extraHeight: number) => {
      if (doc.y + extraHeight + 40 > pageBottom) {
        doc.addPage()
      }
    }

    // helper pour centrer verticalement un texte dans une cellule
    function drawCell(
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      align: 'left' | 'center' | 'right' = 'center',
      bold = false
    ) {
      const fontName = bold ? 'Helvetica-Bold' : 'Helvetica'
      doc.font(fontName)

      const availWidth = width - 2 * padding
      const textHeight = doc.heightOfString(text, {
        width: availWidth,
        align,
      })
      const textY = y + (height - textHeight) / 2

      doc.text(text, x + padding, textY, {
        width: availWidth,
        align,
      })
    }

    // --- Logo (préférence PNG, fallback SVG) ---
    try {
      const publicDir = app.makePath('public')
      const logoPng = join(publicDir, 'logo.png')
      const logoSvg = join(publicDir, 'logo.svg')

      if (fs.existsSync(logoPng)) {
        doc.image(logoPng, leftMargin, 40, { width: 80 })
      } else if (fs.existsSync(logoSvg)) {
        try {
          // @ts-ignore pdfkit & svg
          doc.image(logoSvg, leftMargin, 40, { width: 80 })
        } catch {
          /* ignore si svg non supporté */
        }
      }
    } catch {
      /* noop */
    }

    // --- Titres ---
    doc.font('Helvetica-Bold').fontSize(20).text('ROADMAPP', leftMargin, 50, {
      align: 'center',
      width: usableWidth,
    })

    doc.fontSize(12).text('HISTORIQUE DES TRAJETS DU', leftMargin, 80, {
      align: 'center',
      width: usableWidth,
    })

    doc
      .fontSize(11)
      .text(`DU ${formatDateFr(template.from)} AU ${formatDateFr(template.to)}`, leftMargin, 100, {
        align: 'center',
        width: usableWidth,
      })

    doc.moveDown(3)

    // ---------- TABLEAU RÉCAP ----------
    function drawSummaryTable() {
      const headers = ['DATE', 'ETAPES', 'DISTANCE']
      const colWidths = [150, 90, 220]
      const totalWidth = colWidths.reduce((s, w) => s + w, 0)
      const startX = leftMargin + (usableWidth - totalWidth) / 2

      let y = doc.y

      // header
      ensurePage(24)
      doc.save()
      doc.rect(startX, y, totalWidth, 24).fill(headerBg)
      doc.restore()

      doc.fontSize(10)
      let x = startX
      headers.forEach((h, i) => {
        const w = colWidths[i]
        doc.rect(x, y, w, 24).stroke()
        drawCell(h, x, y, w, 24, 'center', true)
        x += w
      })

      y += 24

      // lignes
      for (const row of template.rows) {
        ensurePage(18)
        x = startX
        const cells = [
          formatDateFr(row.date),
          String(Number(row.stepsCount ?? 0)),
          row.distanceToString,
        ]

        cells.forEach((c, i) => {
          const w = colWidths[i]
          doc.rect(x, y, w, 18).stroke()
          drawCell(c, x, y, w, 18, 'center', false)
          x += w
        })

        y += 18
      }

      // TOTAL global (somme des distances affichées)
      ensurePage(20)
      x = startX

      const totalStepsLabel = String(Number(template.totalSteps))
      const totalKmLabel = formatKmLabel(template.totalKm)

      doc.save()
      doc.rect(startX, y, totalWidth, 20).fill(totalBg)
      doc.restore()

      doc.fillColor('white')

      const totalCells = ['TOTAL', totalStepsLabel, totalKmLabel]
      totalCells.forEach((c, i) => {
        const w = colWidths[i]
        doc.rect(x, y, w, 20).stroke()
        drawCell(c, x, y, w, 20, 'center', true)
        x += w
      })

      doc.fillColor('black')
      doc.moveDown(2)
    }

    // ---------- TABLEAU DÉTAILLÉ + TOTAUX ----------
    function drawDetailedTable() {
      const headers = ['DATE', 'ETAPES', 'DISTANCE', 'DÉPART', 'ARRIVÉE']
      const colWidths = [90, 60, 90, 150, 150]
      const totalWidth = colWidths.reduce((s, w) => s + w, 0)
      const startX = leftMargin + (usableWidth - totalWidth) / 2

      let y = doc.y

      // header
      ensurePage(24)
      doc.save()
      doc.rect(startX, y, totalWidth, 24).fill(headerBg)
      doc.restore()

      doc.fontSize(10)
      let x = startX
      headers.forEach((h, i) => {
        const w = colWidths[i]
        doc.rect(x, y, w, 24).stroke()
        drawCell(h, x, y, w, 24, 'center', true)
        x += w
      })
      y += 24

      // stats par mois
      const monthStats = new Map<string, { label: string; steps: number; km: number }>()

      for (const row of template.rows) {
        const dateObj = new Date(row.date)
        const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`
        const monthLabel = `${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${dateObj.getFullYear()}`

        const stat = monthStats.get(monthKey) ?? {
          label: monthLabel,
          steps: 0,
          km: 0,
        }
        stat.steps += Number(row.stepsCount ?? 0)
        stat.km += row.distanceKm
        monthStats.set(monthKey, stat)

        // ligne principale
        ensurePage(18)
        x = startX

        const mainCells = [
          formatDateFr(row.date),
          String(row.stepsCount ?? 0),
          row.distanceToString,
          '',
          '',
        ]

        mainCells.forEach((c, i) => {
          const w = colWidths[i]
          doc.rect(x, y, w, 18).stroke()
          if (i <= 2) {
            drawCell(c, x, y, w, 18, 'center', true)
          }
          x += w
        })

        y += 18

        // lignes d'étapes
        if (row.legs && row.legs.length) {
          for (let idx = 0; idx < row.legs.length; idx++) {
            const leg = row.legs[idx]

            const fromHeight = doc.heightOfString(leg.fromAddressText || '', {
              width: colWidths[3] - 2 * padding,
            })
            const toHeight = doc.heightOfString(leg.toAddressText || '', {
              width: colWidths[4] - 2 * padding,
            })
            // on ajoute 4 * padding pour vraiment centrer verticalement
            const rowHeight = Math.max(18, fromHeight, toHeight) + 4 * padding

            ensurePage(rowHeight)
            x = startX

            const cells = [
              '',
              String(idx + 1),
              leg.distanceToString,
              leg.fromAddressText ?? '',
              leg.toAddressText ?? '',
            ]

            cells.forEach((c, i) => {
              const w = colWidths[i]
              doc.rect(x, y, w, rowHeight).stroke()
              if (i <= 2) {
                // numéros & distances centrés verticalement
                drawCell(c, x, y, w, rowHeight, 'center', false)
              } else {
                // adresses aussi centrées verticalement dans la cellule
                drawCell(c, x, y, w, rowHeight, 'left', false)
              }
              x += w
            })

            y += rowHeight
          }
        }

        // ligne de séparation
        ensurePage(10)
        doc.rect(startX, y, totalWidth, 10).stroke()
        y += 10
      }

      // un peu d'air avant le bloc des totaux
      doc.moveDown(2)

      // -------- TOTAUX PAR MOIS --------
      if (monthStats.size > 0) {
        const recapHeaders = ['MOIS', 'ETAPES', 'DISTANCE']
        const recapColWidths = [110, 90, 160]
        const recapTotalWidth = recapColWidths.reduce((s, w) => s + w, 0)
        const recapStartX = leftMargin + (usableWidth - recapTotalWidth) / 2
        let ry = doc.y

        ensurePage(24)
        doc.save()
        doc.rect(recapStartX, ry, recapTotalWidth, 24).fill(headerBg)
        doc.restore()

        doc.fontSize(10)
        let rx = recapStartX
        recapHeaders.forEach((h, i) => {
          const w = recapColWidths[i]
          doc.rect(rx, ry, w, 24).stroke()
          drawCell(h, rx, ry, w, 24, 'center', true)
          rx += w
        })
        ry += 24

        // TRI CHRONO sur la clé YYYY-MM
        const sortedMonths = Array.from(monthStats.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([, value]) => value)

        for (const m of sortedMonths) {
          ensurePage(18)
          rx = recapStartX

          const cells = [m.label, String(Number(m.steps)), formatKmLabel(m.km)]

          cells.forEach((c, i) => {
            const w = recapColWidths[i]
            doc.rect(rx, ry, w, 18).stroke()
            drawCell(c, rx, ry, w, 18, 'center', false)
            rx += w
          })

          ry += 18
        }

        // TOTAL PÉRIODE
        ensurePage(20)
        rx = recapStartX

        const totalStepsLabel = String(Number(template.totalSteps))
        const totalKmLabel = formatKmLabel(template.totalKm)

        doc.save()
        doc.rect(recapStartX, ry, recapTotalWidth, 20).fill(totalBg)
        doc.restore()

        doc.fillColor('white')

        const totalCells = ['TOTAL PÉRIODE', totalStepsLabel, totalKmLabel]
        totalCells.forEach((c, i) => {
          const w = recapColWidths[i]
          doc.rect(rx, ry, w, 20).stroke()
          drawCell(c, rx, ry, w, 20, 'center', true)
          rx += w
        })

        doc.fillColor('black')
      }
    }

    if (!detailed) {
      drawSummaryTable()
    } else {
      drawDetailedTable()
    }

    doc.end()
  })
}
