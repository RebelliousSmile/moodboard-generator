import { DEFAULT_FORMAT } from './formats'
import {
    DEFAULT_APPEARANCE,
    DEFAULT_GRID,
    type AtelierDocument,
    type DocumentPage,
} from './schema'

export const DEFAULT_DOCUMENT_TITLE = 'Sans titre'

/** Identifiant snake_case `prefixe_n`, avec le plus petit n libre. */
export function createId(prefix: string, existing: Iterable<string>): string {
    const taken = new Set(existing)
    let index = 1
    while (taken.has(`${prefix}_${index}`)) index += 1
    return `${prefix}_${index}`
}

export function createEmptyPage(existing: Iterable<string> = []): DocumentPage {
    return { id: createId('planche', existing), titre: '', cadres: [] }
}

export function createEmptyDocument(
    titre: string = DEFAULT_DOCUMENT_TITLE
): AtelierDocument {
    return {
        titre: titre.trim() || DEFAULT_DOCUMENT_TITLE,
        format: DEFAULT_FORMAT,
        grille: { ...DEFAULT_GRID },
        apparence: { ...DEFAULT_APPEARANCE, legende: { ...DEFAULT_APPEARANCE.legende } },
        images: [],
        planches: [createEmptyPage()],
    }
}
