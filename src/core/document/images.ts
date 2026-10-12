import { createId } from './model'
import {
    DEFAULT_FOCUS,
    type AtelierDocument,
    type DocumentImage,
} from './schema'

export interface ImageInput {
    url?: string
    descriptif?: string
    tags?: string[]
}

export type ImagePatch = Partial<Omit<DocumentImage, 'id'>>

/** Espaces rognés, vides écartés, doublons retirés ; l'ordre de première apparition est gardé. */
export function normalizeTags(tags: readonly string[]): string[] {
    const seen = new Set<string>()
    for (const tag of tags) {
        const trimmed = tag.trim()
        if (trimmed) seen.add(trimmed)
    }
    return [...seen]
}

/** Ajoute plusieurs images d'un coup et rend leurs identifiants, dans l'ordre. */
export function addImages(
    doc: AtelierDocument,
    inputs: readonly ImageInput[]
): { doc: AtelierDocument; ids: string[] } {
    const taken = doc.images.map((image) => image.id)
    const added: DocumentImage[] = inputs.map((input) => {
        const id = createId('image', taken)
        taken.push(id)
        return {
            id,
            url: (input.url ?? '').trim(),
            descriptif: input.descriptif ?? '',
            tags: normalizeTags(input.tags ?? []),
            focus: { ...DEFAULT_FOCUS },
        }
    })
    return {
        doc: { ...doc, images: [...doc.images, ...added] },
        ids: added.map((image) => image.id),
    }
}

export function addImage(
    doc: AtelierDocument,
    input: ImageInput = {}
): { doc: AtelierDocument; id: string } {
    const result = addImages(doc, [input])
    return { doc: result.doc, id: result.ids[0] }
}

export function updateImage(
    doc: AtelierDocument,
    id: string,
    patch: ImagePatch
): AtelierDocument {
    if (!doc.images.some((image) => image.id === id)) return doc
    return {
        ...doc,
        images: doc.images.map((image) => {
            if (image.id !== id) return image
            const next = { ...image, ...patch }
            if (patch.url !== undefined) next.url = patch.url.trim()
            if (patch.tags !== undefined) next.tags = normalizeTags(patch.tags)
            return next
        }),
    }
}

/** Retire l'image et, s'il existe, le cadre qui la portait. */
export function removeImage(doc: AtelierDocument, id: string): AtelierDocument {
    if (!doc.images.some((image) => image.id === id)) return doc
    return {
        ...doc,
        images: doc.images.filter((image) => image.id !== id),
        planches: doc.planches.map((page) =>
            page.cadres.some((frame) => frame.image === id)
                ? { ...page, cadres: page.cadres.filter((frame) => frame.image !== id) }
                : page
        ),
    }
}

/** Les images qui ne sont posées sur aucune planche. */
export function unplacedImages(doc: AtelierDocument): DocumentImage[] {
    const placed = new Set(
        doc.planches.flatMap((page) => page.cadres.map((frame) => frame.image))
    )
    return doc.images.filter((image) => !placed.has(image.id))
}
