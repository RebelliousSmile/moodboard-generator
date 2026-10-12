import {
    DEFAULT_FRAME_SPAN,
    findFreeSlot,
    isFree,
    overflowingCells,
    withinGrid,
    type Cells,
} from './grid'
import { createEmptyPage } from './model'
import type { AtelierDocument, DocumentFrame, DocumentGrid } from './schema'
import type { FormatId } from './formats'

export type PlacementResult =
    | { ok: true; doc: AtelierDocument }
    | { ok: false; reason: string }

function refuse(reason: string): PlacementResult {
    return { ok: false, reason }
}

function pageIndex(doc: AtelierDocument, pageId: string): number {
    return doc.planches.findIndex((page) => page.id === pageId)
}

function replacePage(
    doc: AtelierDocument,
    pageId: string,
    cadres: DocumentFrame[]
): AtelierDocument {
    return {
        ...doc,
        planches: doc.planches.map((page) => (page.id === pageId ? { ...page, cadres } : page)),
    }
}

/** Ajoute une planche vide à la fin et rend son identifiant. */
export function addPage(doc: AtelierDocument): { doc: AtelierDocument; id: string } {
    const page = createEmptyPage(doc.planches.map((other) => other.id))
    return { doc: { ...doc, planches: [...doc.planches, page] }, id: page.id }
}

/** Retire la planche ; ses images ne sont plus posées, donc reviennent en réserve. */
export function removePage(doc: AtelierDocument, pageId: string): AtelierDocument {
    if (pageIndex(doc, pageId) === -1) return doc
    return { ...doc, planches: doc.planches.filter((page) => page.id !== pageId) }
}

export function renamePage(doc: AtelierDocument, pageId: string, titre: string): AtelierDocument {
    if (pageIndex(doc, pageId) === -1) return doc
    return {
        ...doc,
        planches: doc.planches.map((page) => (page.id === pageId ? { ...page, titre } : page)),
    }
}

/** Déplace la planche à l'index visé (borné à la liste). */
export function movePage(doc: AtelierDocument, pageId: string, toIndex: number): AtelierDocument {
    const from = pageIndex(doc, pageId)
    if (from === -1) return doc
    const target = Math.min(Math.max(0, toIndex), doc.planches.length - 1)
    if (target === from) return doc
    const planches = [...doc.planches]
    const [page] = planches.splice(from, 1)
    planches.splice(target, 0, page)
    return { ...doc, planches }
}

/** Pose l'image sur la planche : à `target` s'il est libre, sinon au premier emplacement libre. */
export function placeFrame(
    doc: AtelierDocument,
    pageId: string,
    imageId: string,
    target?: Pick<Cells, 'x' | 'y'>,
    span: Pick<Cells, 'w' | 'h'> = DEFAULT_FRAME_SPAN
): PlacementResult {
    const index = pageIndex(doc, pageId)
    if (index === -1) return refuse('planche introuvable')
    if (!doc.images.some((image) => image.id === imageId)) return refuse('image introuvable')
    if (doc.planches.some((page) => page.cadres.some((frame) => frame.image === imageId))) {
        return refuse('image déjà posée')
    }
    const page = doc.planches[index]
    const slot = findFreeSlot(span, page.cadres, doc.grille, target)
    if (!slot) return refuse('la planche n’a plus de place pour ce cadre')
    return { ok: true, doc: replacePage(doc, pageId, [...page.cadres, { image: imageId, ...slot }]) }
}

/** Remplace le rectangle d'un cadre (déplacement ou redimensionnement) ; refuse hors grille ou en collision. */
export function setFrameCells(
    doc: AtelierDocument,
    pageId: string,
    imageId: string,
    cells: Cells
): PlacementResult {
    const index = pageIndex(doc, pageId)
    if (index === -1) return refuse('planche introuvable')
    const page = doc.planches[index]
    if (!page.cadres.some((frame) => frame.image === imageId)) return refuse('cadre introuvable')
    if (!withinGrid(cells, doc.grille)) return refuse('le cadre sortirait de la grille')
    const others = page.cadres.filter((frame) => frame.image !== imageId)
    if (!isFree(cells, others, doc.grille)) return refuse('l’emplacement est occupé')
    return {
        ok: true,
        doc: replacePage(
            doc,
            pageId,
            page.cadres.map((frame) =>
                frame.image === imageId
                    ? { image: imageId, x: cells.x, y: cells.y, w: cells.w, h: cells.h }
                    : frame
            )
        ),
    }
}

/** Retire le cadre : l'image revient en réserve, le vide laissé est conservé. */
export function removeFrame(doc: AtelierDocument, imageId: string): AtelierDocument {
    if (!doc.planches.some((page) => page.cadres.some((frame) => frame.image === imageId))) {
        return doc
    }
    return {
        ...doc,
        planches: doc.planches.map((page) =>
            page.cadres.some((frame) => frame.image === imageId)
                ? { ...page, cadres: page.cadres.filter((frame) => frame.image !== imageId) }
                : page
        ),
    }
}

/** Retrouve la planche qui porte l'image, ou null. */
export function findPageOfImage(doc: AtelierDocument, imageId: string): string | null {
    return (
        doc.planches.find((page) => page.cadres.some((frame) => frame.image === imageId))?.id ??
        null
    )
}

export interface Overflow {
    pageId: string
    imageId: string
}

/** Les cadres qui déborderaient d'une grille de ces dimensions. */
export function overflowingFrames(doc: AtelierDocument, grid: DocumentGrid): Overflow[] {
    return doc.planches.flatMap((page) =>
        overflowingCells(page.cadres, grid).map((frame) => ({
            pageId: page.id,
            imageId: frame.image,
        }))
    )
}

export interface DocumentSettings {
    format?: FormatId
    grille?: Partial<DocumentGrid>
}

/**
 * Applique format et grille. Refuse si des cadres déborderaient, sauf `force` : ils sont alors
 * retirés (leurs images reviennent en réserve). L'appelant montre `overflowingFrames` avant.
 */
export function applySettings(
    doc: AtelierDocument,
    settings: DocumentSettings,
    force = false
): PlacementResult {
    const grille = { ...doc.grille, ...settings.grille }
    const overflow = overflowingFrames(doc, grille)
    if (overflow.length > 0 && !force) {
        return refuse(`${overflow.length} cadre(s) déborderaient de la grille`)
    }
    const dropped = new Set(overflow.map((entry) => entry.imageId))
    return {
        ok: true,
        doc: {
            ...doc,
            format: settings.format ?? doc.format,
            grille,
            planches: doc.planches.map((page) => ({
                ...page,
                cadres: page.cadres.filter((frame) => !dropped.has(frame.image)),
            })),
        },
    }
}
