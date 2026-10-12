import { describe, expect, it } from 'vitest'
import {
    selectActiveDocument,
    selectReserveImages,
    selectSelectedImage,
} from './selectors'
import { createWorkspaceStore } from './store'
import type { StorageLike } from './types'

function memoryStorage(): StorageLike {
    const values = new Map<string, string>()
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
            values.set(key, value)
        },
        removeItem: (key) => {
            values.delete(key)
        },
    }
}

describe('images du document actif', () => {
    it('ajoute une image, la sélectionne et la garde après rechargement', () => {
        const storage = memoryStorage()
        const store = createWorkspaceStore(storage)
        store.getState().createDocument('Voyage')
        const imageId = store.getState().addImage({ url: 'https://example.com/a.jpg' })
        store.getState().updateImage(imageId!, { descriptif: 'Une plage', tags: ['mer', 'mer'] })

        const reloaded = selectActiveDocument(createWorkspaceStore(storage).getState())!
        expect(selectSelectedImage(reloaded)).toEqual({
            id: 'image_1',
            url: 'https://example.com/a.jpg',
            descriptif: 'Une plage',
            tags: ['mer'],
            focus: { x: 50, y: 50 },
        })
    })

    it('ne montre en réserve que les images sans cadre', () => {
        const store = createWorkspaceStore(memoryStorage())
        const id = store.getState().createDocument('Voyage')
        store
            .getState()
            .addImages([{ url: 'https://example.com/a.jpg' }, { url: 'https://example.com/b.jpg' }])
        store.getState().updateDocument(id, (doc) => ({
            ...doc,
            planches: [
                { ...doc.planches[0], cadres: [{ image: 'image_1', x: 0, y: 0, w: 2, h: 2 }] },
            ],
        }))

        const entry = selectActiveDocument(store.getState())!
        expect(selectReserveImages(entry).map((image) => image.id)).toEqual(['image_2'])
    })

    it('supprime une image, son cadre et la sélection qui la visait', () => {
        const store = createWorkspaceStore(memoryStorage())
        const id = store.getState().createDocument('Voyage')
        store.getState().addImage({ url: 'https://example.com/a.jpg' })
        store.getState().updateDocument(id, (doc) => ({
            ...doc,
            planches: [
                { ...doc.planches[0], cadres: [{ image: 'image_1', x: 0, y: 0, w: 2, h: 2 }] },
            ],
        }))
        store.getState().removeImage('image_1')

        const entry = selectActiveDocument(store.getState())!
        expect(entry.doc.images).toEqual([])
        expect(entry.doc.planches[0].cadres).toEqual([])
        expect(entry.view.selectedImageId).toBeNull()
    })

    it('ne fait rien sans document actif', () => {
        const store = createWorkspaceStore(memoryStorage())
        expect(store.getState().addImage()).toBeNull()
        expect(store.getState().addImages([{ url: 'https://example.com/a.jpg' }])).toEqual([])
    })
})
