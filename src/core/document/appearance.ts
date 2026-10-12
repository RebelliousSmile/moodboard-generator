import type { CSSProperties } from 'react'
import type { CaptionSettings, DocumentAppearance, DocumentImage, FontId } from './schema'

export const FONT_OPTIONS: Record<FontId, { label: string; family: string }> = {
    inter: { label: 'Inter', family: "'Inter Variable', sans-serif" },
    pt_serif: { label: 'PT Serif', family: "'PT Serif', serif" },
    bebas_neue: { label: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
}

/**
 * Variables CSS que la planche lit. Les feuilles de style (`board.css`) ne connaissent que ces
 * noms : l'apparence du document est la seule source, en édition comme à l'export.
 */
export function appearanceVars(appearance: DocumentAppearance): CSSProperties {
    return {
        '--board-bg': appearance.fond,
        '--board-radius': `${appearance.arrondi}px`,
        '--board-text': appearance.couleur_texte,
        '--board-tags': appearance.couleur_tags,
        '--board-font': FONT_OPTIONS[appearance.police].family,
        '--board-font-size': `${appearance.taille_texte}px`,
    } as CSSProperties
}

/** Ce que la légende d'une image montre, selon ce que le document active ; null s'il n'y a rien. */
export function captionContent(
    image: Pick<DocumentImage, 'descriptif' | 'tags'>,
    caption: CaptionSettings
): { descriptif: string; tags: string[] } | null {
    if (caption.emplacement === 'masquee') return null
    const descriptif = caption.descriptif ? image.descriptif.trim() : ''
    const tags = caption.tags ? image.tags.filter((tag) => tag.trim() !== '') : []
    if (descriptif === '' && tags.length === 0) return null
    return { descriptif, tags }
}
