import { createEmptyDocument } from '@/core/document/model'
import { describe, expect, it } from 'vitest'
import { selectActiveDocument } from './selectors'
import { CORRUPT_STORAGE_KEY, createWorkspaceStore, STORAGE_KEY } from './store'
import type { StorageLike } from './types'

function memoryStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial))
    const control = { failWrites: false }
    const storage: StorageLike = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
            if (control.failWrites) throw new Error('quota dépassé')
            values.set(key, value)
        },
        removeItem: (key) => {
            values.delete(key)
        },
    }
    return { storage, values, control }
}

describe('workspace store', () => {
    it('démarre vide sur un stockage vide', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        expect(store.getState().documents).toEqual([])
        expect(store.getState().activeId).toBeNull()
    })

    it('crée un document, le rend actif et l’écrit aussitôt', () => {
        const { storage, values } = memoryStorage()
        const store = createWorkspaceStore(storage)
        const id = store.getState().createDocument('Voyage')

        expect(store.getState().activeId).toBe(id)
        expect(selectActiveDocument(store.getState())?.doc.titre).toBe('Voyage')
        expect(JSON.parse(values.get(STORAGE_KEY)!)).toMatchObject({
            version: 1,
            activeId: id,
            documents: [{ id, doc: { titre: 'Voyage' } }],
        })
    })

    it('retrouve la liste, le document actif et son titre après rechargement', () => {
        const { storage } = memoryStorage()
        const first = createWorkspaceStore(storage)
        const a = first.getState().createDocument('Premier')
        first.getState().createDocument('Second')
        first.getState().renameDocument(a, 'Premier renommé')
        first.getState().openDocument(a)

        const reloaded = createWorkspaceStore(storage)
        expect(reloaded.getState().documents).toEqual(first.getState().documents)
        expect(reloaded.getState().activeId).toBe(a)
        expect(selectActiveDocument(reloaded.getState())?.doc.titre).toBe('Premier renommé')
    })

    it('ignore un renommage vide', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        const id = store.getState().createDocument('Voyage')
        store.getState().renameDocument(id, '   ')
        expect(selectActiveDocument(store.getState())?.doc.titre).toBe('Voyage')
    })

    it('duplique un document sans lien avec l’original', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        const id = store.getState().createDocument('Voyage')
        const copyId = store.getState().duplicateDocument(id)!

        expect(copyId).not.toBe(id)
        expect(store.getState().activeId).toBe(copyId)
        expect(selectActiveDocument(store.getState())?.doc.titre).toBe('Voyage (copie)')

        store.getState().updateDocument(copyId, (doc) => ({ ...doc, format: 'carre' }))
        const [original, copy] = store.getState().documents
        expect(original.doc.format).toBe('a4_portrait')
        expect(copy.doc.format).toBe('carre')
        expect(copy.doc.planches).not.toBe(original.doc.planches)
    })

    it('supprime un document et active son voisin', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        const a = store.getState().createDocument('A')
        const b = store.getState().createDocument('B')

        store.getState().deleteDocument(b)
        expect(store.getState().documents.map((entry) => entry.id)).toEqual([a])
        expect(store.getState().activeId).toBe(a)

        store.getState().deleteDocument(a)
        expect(store.getState().documents).toEqual([])
        expect(store.getState().activeId).toBeNull()
    })

    it('ne réutilise pas un identifiant encore pris', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        const a = store.getState().createDocument('A')
        const b = store.getState().createDocument('B')
        store.getState().deleteDocument(a)
        const c = store.getState().createDocument('C')
        expect(c).not.toBe(b)
        expect(new Set(store.getState().documents.map((entry) => entry.id)).size).toBe(2)
    })

    it('importe un document sans garder de référence vers la source', () => {
        const store = createWorkspaceStore(memoryStorage().storage)
        const source = createEmptyDocument('Importé')
        const id = store.getState().importDocument(source)
        source.planches[0].titre = 'modifié après coup'

        const entry = selectActiveDocument(store.getState())
        expect(entry?.id).toBe(id)
        expect(entry?.doc.planches[0].titre).toBe('')
        expect(entry?.view.activePageId).toBe('planche_1')
    })

    it('expose l’échec d’écriture tant qu’il dure, puis l’efface', () => {
        const { storage, control } = memoryStorage()
        const store = createWorkspaceStore(storage)
        const id = store.getState().createDocument('Voyage')
        expect(store.getState().saveError).toBeNull()

        control.failWrites = true
        store.getState().renameDocument(id, 'Voyage 2')
        expect(store.getState().saveError).toBe('quota dépassé')
        store.getState().renameDocument(id, 'Voyage 3')
        expect(store.getState().saveError).toBe('quota dépassé')
        store.getState().retrySave()
        expect(store.getState().saveError).toBe('quota dépassé')

        control.failWrites = false
        store.getState().retrySave()
        expect(store.getState().saveError).toBeNull()
        expect(createWorkspaceStore(storage).getState().documents[0].doc.titre).toBe('Voyage 3')
    })

    it.each([
        ['du JSON tronqué', '{"version":1,"documents":['],
        ['une autre version', JSON.stringify({ version: 2, documents: [], activeId: null })],
        [
            'un document invalide',
            JSON.stringify({
                version: 1,
                activeId: 'document_1',
                documents: [{ id: 'document_1', doc: { format: 'a4_portrait' }, view: {} }],
            }),
        ],
        ['une valeur sans rapport', '"bonjour"'],
    ])('repart d’un espace vide sur %s, en gardant une copie', (_label, raw) => {
        const { storage, values } = memoryStorage({ [STORAGE_KEY]: raw })
        const store = createWorkspaceStore(storage)

        expect(store.getState().documents).toEqual([])
        expect(store.getState().activeId).toBeNull()
        expect(values.get(CORRUPT_STORAGE_KEY)).toBe(raw)

        store.getState().createDocument('Nouveau')
        expect(store.getState().saveError).toBeNull()
        expect(createWorkspaceStore(storage).getState().documents).toHaveLength(1)
    })

    it('corrige un document actif qui n’existe plus', () => {
        const doc = createEmptyDocument('Seul')
        const { storage } = memoryStorage({
            [STORAGE_KEY]: JSON.stringify({
                version: 1,
                activeId: 'document_9',
                documents: [{ id: 'document_1', doc, view: { activePageId: 'planche_1' } }],
            }),
        })
        expect(createWorkspaceStore(storage).getState().activeId).toBe('document_1')
    })
})
