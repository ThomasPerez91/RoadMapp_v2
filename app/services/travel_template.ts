// app/services/travel_template.ts
import { DateTime } from 'luxon'
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
 * Option B : total = somme des valeurs affichées (distanceKm).
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
    const steps = Number(t.stepsCount ?? 0) // <--- force en number ici
    return {
      id: t.id,
      date: t.date,
      distanceToString: t.distanceToString,
      distanceKm,
      stepsCount: steps,
    }
  })

  // ---------- Totaux basés sur les valeurs affichées ----------
  const totalKm = rows.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalSteps = rows.reduce(
    (sum, r) => sum + Number(r.stepsCount ?? 0), // <--- et on re-force ici, au cas où
    0
  )

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
    const TABLE_TOP = 140 // hauteur de départ d'un tableau sur une nouvelle page

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

    // --- Logo (PNG en priorité, fallback SVG) ---
    try {
      const publicDir = app.makePath('public')
      const logoPng = join(publicDir, 'logo.png')
      const logoSvg = join(publicDir, 'logo.svg')

      if (fs.existsSync(logoPng)) {
        doc.image(logoPng, leftMargin, 40, { width: 80 })
      } else if (fs.existsSync(logoSvg)) {
        try {
          // @ts-ignore pdfkit & svg
          doc.image(logoSvg, logoSvg, 40, { width: 80 })
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

      let y = doc.y // position de départ

      const drawHeader = () => {
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
      }

      const ensureSpace = (rowHeight: number) => {
        if (y + rowHeight + 40 > pageBottom) {
          doc.addPage()
          y = TABLE_TOP
          drawHeader()
        }
      }

      // premier header
      drawHeader()

      // lignes
      for (const row of template.rows) {
        const rowHeight = 18
        ensureSpace(rowHeight)

        let x = startX
        const cells = [
          formatDateFr(row.date),
          String(Number(row.stepsCount ?? 0)),
          row.distanceToString,
        ]

        cells.forEach((c, i) => {
          const w = colWidths[i]
          doc.rect(x, y, w, rowHeight).stroke()
          drawCell(c, x, y, w, rowHeight, 'center', false)
          x += w
        })

        y += rowHeight
      }

      // TOTAL global
      const totalRowHeight = 20
      ensureSpace(totalRowHeight)

      let x = startX
      const totalStepsLabel = String(Number(template.totalSteps))
      const totalKmLabel = formatKmLabel(template.totalKm)

      doc.save()
      doc.rect(startX, y, totalWidth, totalRowHeight).fill(totalBg)
      doc.restore()

      doc.fillColor('white')

      const totalCells = ['TOTAL', totalStepsLabel, totalKmLabel]
      totalCells.forEach((c, i) => {
        const w = colWidths[i]
        doc.rect(x, y, w, totalRowHeight).stroke()
        drawCell(c, x, y, w, totalRowHeight, 'center', true)
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

      const drawHeader = () => {
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
      }

      const ensureSpace = (rowHeight: number) => {
        if (y + rowHeight + 40 > pageBottom) {
          doc.addPage()
          y = TABLE_TOP
          drawHeader()
        }
      }

      // premier header
      drawHeader()

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
        const mainRowHeight = 18
        ensureSpace(mainRowHeight)

        let x = startX
        const mainCells = [
          formatDateFr(row.date),
          String(row.stepsCount ?? 0),
          row.distanceToString,
          '',
          '',
        ]

        mainCells.forEach((c, i) => {
          const w = colWidths[i]
          doc.rect(x, y, w, mainRowHeight).stroke()
          if (i <= 2) {
            drawCell(c, x, y, w, mainRowHeight, 'center', true)
          }
          x += w
        })

        y += mainRowHeight

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
            const rowHeight = Math.max(18, fromHeight, toHeight) + 4 * padding

            ensureSpace(rowHeight)

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
                drawCell(c, x, y, w, rowHeight, 'center', false)
              } else {
                drawCell(c, x, y, w, rowHeight, 'left', false)
              }
              x += w
            })

            y += rowHeight
          }
        }

        // ligne de séparation
        const sepHeight = 10
        ensureSpace(sepHeight)
        doc.rect(startX, y, totalWidth, sepHeight).stroke()
        y += sepHeight
      }

      doc.moveDown(2)

      // -------- TOTAUX PAR MOIS --------
      if (monthStats.size > 0) {
        const recapHeaders = ['MOIS', 'ETAPES', 'DISTANCE']
        const recapColWidths = [110, 90, 160]
        const recapTotalWidth = recapColWidths.reduce((s, w) => s + w, 0)
        const recapStartX = leftMargin + (usableWidth - recapTotalWidth) / 2
        let ry = doc.y

        const drawRecapHeader = () => {
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
        }

        const ensureRecapSpace = (rowHeight: number) => {
          if (ry + rowHeight + 40 > pageBottom) {
            doc.addPage()
            ry = TABLE_TOP
            drawRecapHeader()
          }
        }

        drawRecapHeader()

        const sortedMonths = Array.from(monthStats.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([, value]) => value)

        for (const m of sortedMonths) {
          const rowHeight = 18
          ensureRecapSpace(rowHeight)
          let rx = recapStartX

          const cells = [m.label, String(Number(m.steps)), formatKmLabel(m.km)]

          cells.forEach((c, i) => {
            const w = recapColWidths[i]
            doc.rect(rx, ry, w, rowHeight).stroke()
            drawCell(c, rx, ry, w, rowHeight, 'center', false)
            rx += w
          })

          ry += rowHeight
        }

        // TOTAL PÉRIODE
        const totalRowHeight = 20
        ensureRecapSpace(totalRowHeight)
        let rx = recapStartX

        const totalStepsLabel = String(Number(template.totalSteps))
        const totalKmLabel = formatKmLabel(template.totalKm)

        doc.save()
        doc.rect(recapStartX, ry, recapTotalWidth, totalRowHeight).fill(totalBg)
        doc.restore()

        doc.fillColor('white')

        const totalCells = ['TOTAL PÉRIODE', totalStepsLabel, totalKmLabel]
        totalCells.forEach((c, i) => {
          const w = recapColWidths[i]
          doc.rect(rx, ry, w, totalRowHeight).stroke()
          drawCell(c, rx, ry, w, totalRowHeight, 'center', true)
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
