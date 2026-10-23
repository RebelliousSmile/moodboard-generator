export const FORMAT_IDS = [
    'a4_portrait',
    'a4_paysage',
    'a3_portrait',
    'a3_paysage',
    'carre',
    'ecran_16_9',
] as const

export type FormatId = (typeof FORMAT_IDS)[number]

export interface PageFormat {
    id: FormatId
    label: string
    widthMm: number
    heightMm: number
    /** Pixels CSS à 96 px par pouce : la géométrie commune à l'écran, au PNG et au PDF. */
    widthPx: number
    heightPx: number
}

const PX_PER_MM = 96 / 25.4

export function mmToPx(mm: number): number {
    return Math.round(mm * PX_PER_MM)
}

function format(id: FormatId, label: string, widthMm: number, heightMm: number): PageFormat {
    return {
        id,
        label,
        widthMm,
        heightMm,
        widthPx: mmToPx(widthMm),
        heightPx: mmToPx(heightMm),
    }
}

export const PAGE_FORMATS: Record<FormatId, PageFormat> = {
    a4_portrait: format('a4_portrait', 'A4 portrait', 210, 297),
    a4_paysage: format('a4_paysage', 'A4 paysage', 297, 210),
    a3_portrait: format('a3_portrait', 'A3 portrait', 297, 420),
    a3_paysage: format('a3_paysage', 'A3 paysage', 420, 297),
    carre: format('carre', 'Carré', 210, 210),
    // 508 × 285,75 mm : exactement 1920 × 1080 px à 96 px par pouce.
    ecran_16_9: format('ecran_16_9', 'Écran 16:9', 508, 285.75),
}

export const DEFAULT_FORMAT: FormatId = 'a4_portrait'

export function getPageFormat(id: FormatId): PageFormat {
    return PAGE_FORMATS[id]
}
