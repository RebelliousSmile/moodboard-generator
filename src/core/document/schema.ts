import { z } from 'zod'
import { DEFAULT_FORMAT, FORMAT_IDS } from './formats'

export const GRID_LIMITS = { min: 1, max: 48 } as const
export const DEFAULT_GRID = { colonnes: 12, rangees: 16 } as const

/** Marge et gouttière en pixels CSS : la géométrie des planches en dépend. */
export const MARGIN_LIMITS = { min: 0, max: 120 } as const
export const GUTTER_LIMITS = { min: 0, max: 60 } as const

export const CAPTION_PLACEMENTS = ['dessous', 'surimpression', 'masquee'] as const
export const FONT_IDS = ['inter', 'pt_serif', 'bebas_neue'] as const
export const RADIUS_LIMITS = { min: 0, max: 48 } as const
export const TEXT_SIZE_LIMITS = { min: 8, max: 32 } as const

export const DEFAULT_APPEARANCE = {
    marge: 32,
    gouttiere: 12,
    legende: { emplacement: 'dessous', descriptif: true, tags: true },
    fond: '#ffffff',
    arrondi: 0,
    couleur_texte: '#171717',
    couleur_tags: '#525252',
    police: 'inter',
    taille_texte: 13,
} as const

export const DEFAULT_FOCUS = { x: 50, y: 50 } as const

const ID_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/

const idSchema = z.string({ error: 'identifiant manquant' }).regex(ID_PATTERN, {
    error: 'identifiant attendu en snake_case (lettres minuscules, chiffres, tirets bas)',
})

const percentSchema = z
    .number({ error: 'nombre attendu' })
    .min(0, { error: 'doit être compris entre 0 et 100' })
    .max(100, { error: 'doit être compris entre 0 et 100' })

function boundedInt(limits: { min: number; max: number }) {
    const error = `entier attendu entre ${limits.min} et ${limits.max}`
    return z.number({ error }).int({ error }).min(limits.min, { error }).max(limits.max, { error })
}

function boundedNumber(limits: { min: number; max: number }) {
    const error = `nombre attendu entre ${limits.min} et ${limits.max}`
    return z.number({ error }).min(limits.min, { error }).max(limits.max, { error })
}

const focusSchema = z
    .object({
        x: percentSchema.default(DEFAULT_FOCUS.x),
        y: percentSchema.default(DEFAULT_FOCUS.y),
    })
    .prefault({})

const imageSchema = z.object({
    id: idSchema,
    // Un lien vide est permis : l'image attend d'être renseignée dans la réserve.
    url: z.string({ error: 'texte attendu' }).trim().default(''),
    descriptif: z.string({ error: 'texte attendu' }).default(''),
    tags: z.array(z.string({ error: 'texte attendu' }), { error: 'liste attendue' }).default([]),
    focus: focusSchema,
})

const cellError = 'entier positif ou nul attendu'
const spanError = 'entier supérieur ou égal à 1 attendu'

const frameSchema = z.object({
    image: idSchema,
    x: z.number({ error: cellError }).int({ error: cellError }).min(0, { error: cellError }),
    y: z.number({ error: cellError }).int({ error: cellError }).min(0, { error: cellError }),
    w: z.number({ error: spanError }).int({ error: spanError }).min(1, { error: spanError }),
    h: z.number({ error: spanError }).int({ error: spanError }).min(1, { error: spanError }),
})

const pageSchema = z.object({
    id: idSchema,
    titre: z.string({ error: 'texte attendu' }).default(''),
    cadres: z.array(frameSchema, { error: 'liste attendue' }).default([]),
})

const gridSchema = z
    .object({
        colonnes: boundedInt(GRID_LIMITS).default(DEFAULT_GRID.colonnes),
        rangees: boundedInt(GRID_LIMITS).default(DEFAULT_GRID.rangees),
    })
    .prefault({})

const colorSchema = z
    .string({ error: 'couleur attendue au format #rrggbb' })
    .regex(/^#[0-9a-fA-F]{6}$/, { error: 'couleur attendue au format #rrggbb' })

const captionSchema = z
    .object({
        emplacement: z
            .enum(CAPTION_PLACEMENTS, {
                error: `emplacement inconnu, attendu : ${CAPTION_PLACEMENTS.join(', ')}`,
            })
            .default(DEFAULT_APPEARANCE.legende.emplacement),
        descriptif: z
            .boolean({ error: 'vrai ou faux attendu' })
            .default(DEFAULT_APPEARANCE.legende.descriptif),
        tags: z.boolean({ error: 'vrai ou faux attendu' }).default(DEFAULT_APPEARANCE.legende.tags),
    })
    .prefault({})

const appearanceSchema = z
    .object({
        marge: boundedNumber(MARGIN_LIMITS).default(DEFAULT_APPEARANCE.marge),
        gouttiere: boundedNumber(GUTTER_LIMITS).default(DEFAULT_APPEARANCE.gouttiere),
        legende: captionSchema,
        fond: colorSchema.default(DEFAULT_APPEARANCE.fond),
        arrondi: boundedNumber(RADIUS_LIMITS).default(DEFAULT_APPEARANCE.arrondi),
        couleur_texte: colorSchema.default(DEFAULT_APPEARANCE.couleur_texte),
        couleur_tags: colorSchema.default(DEFAULT_APPEARANCE.couleur_tags),
        police: z
            .enum(FONT_IDS, { error: `police inconnue, attendue : ${FONT_IDS.join(', ')}` })
            .default(DEFAULT_APPEARANCE.police),
        taille_texte: boundedNumber(TEXT_SIZE_LIMITS).default(DEFAULT_APPEARANCE.taille_texte),
    })
    .prefault({})

export const documentSchema = z
    .object({
        titre: z.string({ error: 'titre manquant' }).trim().min(1, { error: 'titre manquant' }),
        format: z
            .enum(FORMAT_IDS, {
                error: `format inconnu, attendu : ${FORMAT_IDS.join(', ')}`,
            })
            .default(DEFAULT_FORMAT),
        grille: gridSchema,
        apparence: appearanceSchema,
        images: z.array(imageSchema, { error: 'liste attendue' }).default([]),
        planches: z.array(pageSchema, { error: 'liste attendue' }).default([]),
    })
    .superRefine((doc, ctx) => {
        const imageIds = new Set<string>()
        doc.images.forEach((image, index) => {
            if (imageIds.has(image.id)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['images', index, 'id'],
                    message: `identifiant « ${image.id} » déjà utilisé par une autre image`,
                })
            }
            imageIds.add(image.id)
        })

        const pageIds = new Set<string>()
        const placedImages = new Set<string>()
        doc.planches.forEach((page, pageIndex) => {
            if (pageIds.has(page.id)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['planches', pageIndex, 'id'],
                    message: `identifiant « ${page.id} » déjà utilisé par une autre planche`,
                })
            }
            pageIds.add(page.id)

            page.cadres.forEach((frame, frameIndex) => {
                const path = ['planches', pageIndex, 'cadres', frameIndex]
                if (frame.x + frame.w > doc.grille.colonnes) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [...path, 'w'],
                        message: `cadre hors grille : x + w dépasse les ${doc.grille.colonnes} colonnes`,
                    })
                }
                if (frame.y + frame.h > doc.grille.rangees) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [...path, 'h'],
                        message: `cadre hors grille : y + h dépasse les ${doc.grille.rangees} rangées`,
                    })
                }
                if (!imageIds.has(frame.image)) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [...path, 'image'],
                        message: `image « ${frame.image} » absente du document`,
                    })
                } else if (placedImages.has(frame.image)) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [...path, 'image'],
                        message: `image « ${frame.image} » déjà posée dans un autre cadre`,
                    })
                }
                placedImages.add(frame.image)
            })
        })
    })

export type AtelierDocument = z.infer<typeof documentSchema>
export type DocumentImage = AtelierDocument['images'][number]
export type DocumentPage = AtelierDocument['planches'][number]
export type DocumentFrame = DocumentPage['cadres'][number]
export type DocumentGrid = AtelierDocument['grille']
export type DocumentAppearance = AtelierDocument['apparence']
export type CaptionSettings = DocumentAppearance['legende']
export type CaptionPlacement = (typeof CAPTION_PLACEMENTS)[number]
export type FontId = (typeof FONT_IDS)[number]

export type DocumentParseResult =
    { ok: true; document: AtelierDocument } | { ok: false; errors: string[] }

function formatPath(path: PropertyKey[]): string {
    return path.reduce<string>((text, segment) => {
        if (typeof segment === 'number') return `${text}[${segment}]`
        return text ? `${text}.${String(segment)}` : String(segment)
    }, '')
}

/** Valide une valeur quelconque ; chaque erreur nomme le champ fautif. */
export function parseDocument(value: unknown): DocumentParseResult {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return {
            ok: false,
            errors: ['document : une liste de champs (titre, images, planches…) est attendue'],
        }
    }
    const result = documentSchema.safeParse(value)
    if (result.success) return { ok: true, document: result.data }
    return {
        ok: false,
        errors: result.error.issues.map((issue) => {
            const path = formatPath(issue.path)
            return path ? `${path} : ${issue.message}` : issue.message
        }),
    }
}
