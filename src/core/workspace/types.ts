import type { Cells } from '@/core/document/grid'
import type { ImageInput, ImagePatch } from '@/core/document/images'
import type { DocumentSettings, PlacementResult } from '@/core/document/pages'
import type { AtelierDocument, CaptionSettings, DocumentAppearance } from '@/core/document/schema'

/** Modification partielle de l'apparence ; la légende se règle champ par champ. */
export type AppearancePatch = Partial<Omit<DocumentAppearance, 'legende'>> & {
    legende?: Partial<CaptionSettings>
}

/** État d'interface d'un document : jamais écrit dans le fichier YAML. */
export interface DocumentView {
    activePageId: string | null
    /** Une image posée sélectionnée vaut sélection de son cadre. */
    selectedImageId: string | null
    /** Zoom manuel de la planche active ; null : ajusté à la zone disponible. */
    zoom: number | null
}

export interface WorkspaceDocument {
    id: string
    /** Ce qui est exporté. */
    doc: AtelierDocument
    /** Ce qui ne l'est pas. */
    view: DocumentView
}

export interface WorkspaceSnapshot {
    version: 1
    documents: WorkspaceDocument[]
    activeId: string | null
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface WorkspaceState {
    documents: WorkspaceDocument[]
    activeId: string | null
    /** Message de la dernière écriture locale en échec, null quand elle a réussi. */
    saveError: string | null

    createDocument: (titre?: string) => string
    importDocument: (doc: AtelierDocument) => string
    openDocument: (id: string) => void
    renameDocument: (id: string, titre: string) => void
    duplicateDocument: (id: string) => string | null
    deleteDocument: (id: string) => void
    updateDocument: (
        id: string,
        updater: (doc: AtelierDocument) => AtelierDocument
    ) => void
    updateView: (id: string, patch: Partial<DocumentView>) => void

    /** Les actions sur les images portent sur le document actif. */
    addImage: (input?: ImageInput) => string | null
    addImages: (inputs: ImageInput[]) => string[]
    updateImage: (imageId: string, patch: ImagePatch) => void
    removeImage: (imageId: string) => void
    selectImage: (imageId: string | null) => void

    /** Les actions sur les planches et les cadres portent aussi sur le document actif. */
    addPage: () => string | null
    removePage: (pageId: string) => void
    renamePage: (pageId: string, titre: string) => void
    movePage: (pageId: string, toIndex: number) => void
    setActivePage: (pageId: string) => void
    /** Pose l'image sur la planche active (`target` : cellule visée) ; refus motivé sinon. */
    placeImage: (imageId: string, target?: Pick<Cells, 'x' | 'y'>) => PlacementResult
    setFrameCells: (imageId: string, cells: Cells) => PlacementResult
    /** Renvoie l'image en réserve. */
    unplaceImage: (imageId: string) => void
    applySettings: (settings: DocumentSettings, force?: boolean) => PlacementResult
    setZoom: (zoom: number | null) => void
    /** L'apparence est unique pour le document : toutes les planches la suivent. */
    updateAppearance: (patch: AppearancePatch) => void
    resetAppearance: () => void
    /** Retente l'écriture locale de l'état courant. */
    retrySave: () => void
}
