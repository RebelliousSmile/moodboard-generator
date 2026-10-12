import { unplacedImages } from '@/core/document/images'
import type { DocumentFrame, DocumentImage, DocumentPage } from '@/core/document/schema'
import type { WorkspaceDocument, WorkspaceState } from './types'

export function selectActiveDocument(state: WorkspaceState): WorkspaceDocument | null {
    return state.documents.find((entry) => entry.id === state.activeId) ?? null
}

export function selectHasDocuments(state: WorkspaceState): boolean {
    return state.documents.length > 0
}

/** Les images du document qui ne sont posées sur aucune planche. */
export function selectReserveImages(entry: WorkspaceDocument): DocumentImage[] {
    return unplacedImages(entry.doc)
}

export function selectSelectedImage(entry: WorkspaceDocument): DocumentImage | null {
    return entry.doc.images.find((image) => image.id === entry.view.selectedImageId) ?? null
}

/** La planche active du document : celle de la vue si elle existe, sinon la première. */
export function selectActivePage(entry: WorkspaceDocument): DocumentPage | null {
    return (
        entry.doc.planches.find((page) => page.id === entry.view.activePageId) ??
        entry.doc.planches[0] ??
        null
    )
}

/** Le cadre de l'image sélectionnée, s'il est posé. */
export function selectSelectedFrame(entry: WorkspaceDocument): DocumentFrame | null {
    const { selectedImageId } = entry.view
    if (!selectedImageId) return null
    for (const page of entry.doc.planches) {
        const frame = page.cadres.find((candidate) => candidate.image === selectedImageId)
        if (frame) return frame
    }
    return null
}
