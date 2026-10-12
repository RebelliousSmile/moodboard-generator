import {
    copyDocumentFiles,
    detachLocalFile,
    purgeDocumentFiles,
} from '@/core/assets/localSources'
import { addImages, removeImage, updateImage } from '@/core/document/images'
import { createEmptyDocument, createId } from '@/core/document/model'
import {
    addPage as addPageTo,
    applySettings as applySettingsTo,
    movePage as movePageIn,
    placeFrame,
    removeFrame,
    removePage as removePageFrom,
    renamePage as renamePageIn,
    setFrameCells as setFrameCellsIn,
    type PlacementResult,
} from '@/core/document/pages'
import {
    DEFAULT_APPEARANCE,
    documentSchema,
    type AtelierDocument,
} from '@/core/document/schema'
import { cloneValue } from '@/utils/clone'
import { z } from 'zod'
import { create } from 'zustand'
import type {
    DocumentView,
    StorageLike,
    WorkspaceDocument,
    WorkspaceSnapshot,
    WorkspaceState,
} from './types'

export const STORAGE_KEY = 'atelier:workspace:v1'
/** Copie d'un instantané illisible, gardée avant le repli sur un espace vide. */
export const CORRUPT_STORAGE_KEY = `${STORAGE_KEY}:illisible`

const snapshotSchema = z.object({
    version: z.literal(1),
    activeId: z.string().nullable(),
    documents: z.array(
        z.object({
            id: z.string().min(1),
            doc: documentSchema,
            view: z
                .object({
                    activePageId: z.string().nullable().default(null),
                    selectedImageId: z.string().nullable().default(null),
                    zoom: z.number().min(0.1).max(4).nullable().default(null),
                })
                .prefault({}),
        })
    ),
})

const EMPTY_SNAPSHOT: WorkspaceSnapshot = {
    version: 1,
    documents: [],
    activeId: null,
}

function defaultView(doc: AtelierDocument): DocumentView {
    return { activePageId: doc.planches[0]?.id ?? null, selectedImageId: null, zoom: null }
}

/** Lit l'instantané ; toute forme inattendue ramène à un espace vide. */
export function loadSnapshot(storage: StorageLike): WorkspaceSnapshot {
    let raw: string | null
    try {
        raw = storage.getItem(STORAGE_KEY)
    } catch {
        return EMPTY_SNAPSHOT
    }
    if (raw === null) return EMPTY_SNAPSHOT

    let value: unknown
    try {
        value = JSON.parse(raw)
    } catch {
        value = undefined
    }
    const result = snapshotSchema.safeParse(value)
    const ids = result.success ? result.data.documents.map((entry) => entry.id) : []
    if (!result.success || new Set(ids).size !== ids.length) {
        try {
            storage.setItem(CORRUPT_STORAGE_KEY, raw)
        } catch {
            // Sans place pour la copie, le repli reste la seule issue.
        }
        return EMPTY_SNAPSHOT
    }

    const { documents, activeId } = result.data
    return {
        version: 1,
        documents,
        activeId: ids.includes(activeId ?? '') ? activeId : (ids[0] ?? null),
    }
}

function writeSnapshot(
    storage: StorageLike,
    state: Pick<WorkspaceState, 'documents' | 'activeId'>
): string | null {
    const snapshot: WorkspaceSnapshot = {
        version: 1,
        documents: state.documents,
        activeId: state.activeId,
    }
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
        return null
    } catch (error) {
        return error instanceof Error ? error.message : String(error)
    }
}

/** La planche active : celle de la vue si elle existe encore, sinon la première. */
export function resolveActivePageId(entry: WorkspaceDocument): string | null {
    const { planches } = entry.doc
    return planches.some((page) => page.id === entry.view.activePageId)
        ? entry.view.activePageId
        : (planches[0]?.id ?? null)
}

/** Le ménage des fichiers locaux ne bloque jamais l'édition : un échec se consigne seulement. */
function reportLocalFileFailure(operation: Promise<void>): void {
    operation.catch((error: unknown) => console.error('Fichiers locaux inchangés', error))
}

function withDocument(
    documents: WorkspaceDocument[],
    id: string,
    change: (entry: WorkspaceDocument) => WorkspaceDocument
): WorkspaceDocument[] {
    return documents.map((entry) => (entry.id === id ? change(entry) : entry))
}

export function createWorkspaceStore(storage: StorageLike) {
    const initial = loadSnapshot(storage)

    const store = create<WorkspaceState>()((set, get) => {
        function addDocument(doc: AtelierDocument): string {
            const id = createId(
                'document',
                get().documents.map((entry) => entry.id)
            )
            set((state) => ({
                documents: [...state.documents, { id, doc, view: defaultView(doc) }],
                activeId: id,
            }))
            return id
        }

        /** Applique un changement au document actif ; sans document actif, ne fait rien. */
        function changeActive(change: (entry: WorkspaceDocument) => WorkspaceDocument) {
            const { activeId } = get()
            if (!activeId) return
            set((state) => ({ documents: withDocument(state.documents, activeId, change) }))
        }

        /** Idem pour une opération qui peut être refusée ; `select` : image à sélectionner en cas de succès. */
        function changeActiveWith(
            operation: (entry: WorkspaceDocument) => PlacementResult,
            select?: string
        ): PlacementResult {
            const active = get().documents.find((entry) => entry.id === get().activeId)
            if (!active) return { ok: false, reason: 'aucun document actif' }
            const result = operation(active)
            if (!result.ok) return result
            set((state) => ({
                documents: withDocument(state.documents, active.id, (entry) => ({
                    ...entry,
                    doc: result.doc,
                    view: select ? { ...entry.view, selectedImageId: select } : entry.view,
                })),
            }))
            return result
        }

        return {
            documents: initial.documents,
            activeId: initial.activeId,
            saveError: null,

            createDocument: (titre) => addDocument(createEmptyDocument(titre)),

            importDocument: (doc) => addDocument(cloneValue(doc)),

            openDocument: (id) => {
                if (get().documents.some((entry) => entry.id === id)) set({ activeId: id })
            },

            renameDocument: (id, titre) => {
                const next = titre.trim()
                if (!next) return
                get().updateDocument(id, (doc) => ({ ...doc, titre: next }))
            },

            duplicateDocument: (id) => {
                const source = get().documents.find((entry) => entry.id === id)
                if (!source) return null
                const copy = cloneValue(source.doc)
                copy.titre = `${copy.titre} (copie)`
                const copyId = addDocument(copy)
                if (copyId) reportLocalFileFailure(copyDocumentFiles(id, copyId))
                return copyId
            },

            deleteDocument: (id) => {
                set((state) => {
                    const index = state.documents.findIndex((entry) => entry.id === id)
                    if (index === -1) return state
                    reportLocalFileFailure(purgeDocumentFiles(id))
                    const documents = state.documents.filter((entry) => entry.id !== id)
                    const neighbour = documents[Math.min(index, documents.length - 1)]
                    return {
                        documents,
                        activeId:
                            state.activeId === id ? (neighbour?.id ?? null) : state.activeId,
                    }
                })
            },

            updateDocument: (id, updater) => {
                set((state) => ({
                    documents: withDocument(state.documents, id, (entry) => ({
                        ...entry,
                        doc: updater(entry.doc),
                    })),
                }))
            },

            updateView: (id, patch) => {
                set((state) => ({
                    documents: withDocument(state.documents, id, (entry) => ({
                        ...entry,
                        view: { ...entry.view, ...patch },
                    })),
                }))
            },

            addImage: (input = {}) => get().addImages([input])[0] ?? null,

            addImages: (inputs) => {
                const active = get().documents.find((entry) => entry.id === get().activeId)
                if (!active || inputs.length === 0) return []
                const { doc, ids } = addImages(active.doc, inputs)
                set((state) => ({
                    documents: withDocument(state.documents, active.id, (entry) => ({
                        ...entry,
                        doc,
                        view: { ...entry.view, selectedImageId: ids[ids.length - 1] },
                    })),
                }))
                return ids
            },

            updateImage: (imageId, patch) => {
                const { activeId, updateDocument } = get()
                if (activeId) updateDocument(activeId, (doc) => updateImage(doc, imageId, patch))
            },

            removeImage: (imageId) => {
                const { activeId } = get()
                if (activeId) reportLocalFileFailure(detachLocalFile(activeId, imageId))
                set((state) => ({
                    documents: withDocument(state.documents, state.activeId ?? '', (entry) => ({
                        ...entry,
                        doc: removeImage(entry.doc, imageId),
                        view:
                            entry.view.selectedImageId === imageId
                                ? { ...entry.view, selectedImageId: null }
                                : entry.view,
                    })),
                }))
            },

            selectImage: (imageId) => {
                const { activeId, updateView } = get()
                if (activeId) updateView(activeId, { selectedImageId: imageId })
            },

            addPage: () => {
                const active = get().documents.find((entry) => entry.id === get().activeId)
                if (!active) return null
                const { doc, id } = addPageTo(active.doc)
                set((state) => ({
                    documents: withDocument(state.documents, active.id, (entry) => ({
                        ...entry,
                        doc,
                        view: { ...entry.view, activePageId: id },
                    })),
                }))
                return id
            },

            removePage: (pageId) => {
                changeActive((entry) => {
                    const index = entry.doc.planches.findIndex((page) => page.id === pageId)
                    if (index === -1) return entry
                    const doc = removePageFrom(entry.doc, pageId)
                    const keep = resolveActivePageId(entry) !== pageId
                    const neighbour = doc.planches[Math.min(index, doc.planches.length - 1)]
                    const selectedStillExists = doc.images.some(
                        (image) => image.id === entry.view.selectedImageId
                    )
                    return {
                        ...entry,
                        doc,
                        view: {
                            ...entry.view,
                            activePageId: keep ? entry.view.activePageId : (neighbour?.id ?? null),
                            selectedImageId: selectedStillExists ? entry.view.selectedImageId : null,
                        },
                    }
                })
            },

            renamePage: (pageId, titre) => {
                changeActive((entry) => ({ ...entry, doc: renamePageIn(entry.doc, pageId, titre) }))
            },

            movePage: (pageId, toIndex) => {
                changeActive((entry) => ({ ...entry, doc: movePageIn(entry.doc, pageId, toIndex) }))
            },

            setActivePage: (pageId) => {
                const { activeId, updateView } = get()
                if (activeId) updateView(activeId, { activePageId: pageId })
            },

            placeImage: (imageId, target) =>
                changeActiveWith((entry) => {
                    const pageId = resolveActivePageId(entry)
                    if (!pageId) return { ok: false, reason: 'aucune planche' }
                    return placeFrame(entry.doc, pageId, imageId, target)
                }, imageId),

            setFrameCells: (imageId, cells) =>
                changeActiveWith((entry) => {
                    const pageId = entry.doc.planches.find((page) =>
                        page.cadres.some((frame) => frame.image === imageId)
                    )?.id
                    if (!pageId) return { ok: false, reason: 'cadre introuvable' }
                    return setFrameCellsIn(entry.doc, pageId, imageId, cells)
                }),

            unplaceImage: (imageId) => {
                changeActive((entry) => ({ ...entry, doc: removeFrame(entry.doc, imageId) }))
            },

            applySettings: (settings, force = false) =>
                changeActiveWith((entry) => applySettingsTo(entry.doc, settings, force)),

            updateAppearance: (patch) => {
                const { activeId, updateDocument } = get()
                if (!activeId) return
                updateDocument(activeId, (doc) => ({
                    ...doc,
                    apparence: {
                        ...doc.apparence,
                        ...patch,
                        legende: { ...doc.apparence.legende, ...patch.legende },
                    },
                }))
            },

            resetAppearance: () => {
                const { activeId, updateDocument } = get()
                if (!activeId) return
                updateDocument(activeId, (doc) => ({
                    ...doc,
                    apparence: {
                        ...DEFAULT_APPEARANCE,
                        legende: { ...DEFAULT_APPEARANCE.legende },
                    },
                }))
            },

            setZoom: (zoom) => {
                const { activeId, updateView } = get()
                if (activeId) updateView(activeId, { zoom })
            },

            retrySave: () => set({ saveError: writeSnapshot(storage, get()) }),
        }
    })

    // Écriture synchrone à chaque mutation ; l'échec reste dans l'état jusqu'à la prochaine écriture réussie.
    store.subscribe((state, previous) => {
        if (state.documents === previous.documents && state.activeId === previous.activeId) {
            return
        }
        const saveError = writeSnapshot(storage, state)
        if (saveError !== state.saveError) store.setState({ saveError })
    })

    return store
}

/** Stockage du navigateur, ou un stockage qui échoue quand il est interdit (mode privé strict). */
function browserStorage(): StorageLike {
    try {
        return window.localStorage
    } catch {
        const refuse = (): never => {
            throw new Error('stockage local indisponible')
        }
        return { getItem: () => null, setItem: refuse, removeItem: refuse }
    }
}

export const useWorkspaceStore = createWorkspaceStore(browserStorage())
