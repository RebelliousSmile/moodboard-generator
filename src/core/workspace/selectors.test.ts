import { addImages } from '@/core/document/images'
import { createEmptyDocument } from '@/core/document/model'
import { describe, expect, it } from 'vitest'
import {
    selectActiveDocument,
    selectActivePage,
    selectHasDocuments,
    selectReserveImages,
    selectSelectedFrame,
    selectSelectedImage,
} from './selectors'
import type { WorkspaceDocument, WorkspaceState } from './types'

function entry(id = 'doc_1'): WorkspaceDocument {
    const { doc } = addImages(createEmptyDocument('Voyage'), [
        { url: 'https://example.com/a.jpg' },
        { url: 'https://example.com/b.jpg' },
    ])
    doc.planches[0].cadres.push({ image: 'image_1', x: 0, y: 0, w: 6, h: 8 })
    return { id, doc, view: { activePageId: null, selectedImageId: null, zoom: null } }
}

function state(documents: WorkspaceDocument[], activeId: string | null): WorkspaceState {
    return { documents, activeId } as WorkspaceState
}

describe('selectActiveDocument', () => {
    it('renvoie le document actif, ou null', () => {
        const a = entry('a')
        expect(selectActiveDocument(state([a, entry('b')], 'a'))).toBe(a)
        expect(selectActiveDocument(state([a], 'absent'))).toBeNull()
        expect(selectActiveDocument(state([], null))).toBeNull()
    })
})

describe('selectHasDocuments', () => {
    it("vaut vrai dès qu'un document existe", () => {
        expect(selectHasDocuments(state([], null))).toBe(false)
        expect(selectHasDocuments(state([entry()], null))).toBe(true)
    })
})

describe('selectReserveImages', () => {
    it('ne garde que les images non posées', () => {
        expect(selectReserveImages(entry()).map((image) => image.id)).toEqual(['image_2'])
    })
})

describe('selectSelectedImage et selectSelectedFrame', () => {
    it('suivent selectedImageId', () => {
        const e = entry()
        e.view.selectedImageId = 'image_1'
        expect(selectSelectedImage(e)?.id).toBe('image_1')
        expect(selectSelectedFrame(e)).toMatchObject({ image: 'image_1', w: 6 })
    })

    it('renvoient null sans sélection, et pas de cadre pour une image en réserve', () => {
        const e = entry()
        expect(selectSelectedImage(e)).toBeNull()
        expect(selectSelectedFrame(e)).toBeNull()
        e.view.selectedImageId = 'image_2'
        expect(selectSelectedImage(e)?.id).toBe('image_2')
        expect(selectSelectedFrame(e)).toBeNull()
    })
})

describe('selectActivePage', () => {
    it('prend la planche de la vue, sinon la première', () => {
        const e = entry()
        expect(selectActivePage(e)?.id).toBe('planche_1')
        e.doc.planches.push({ id: 'planche_2', titre: '', cadres: [] })
        e.view.activePageId = 'planche_2'
        expect(selectActivePage(e)?.id).toBe('planche_2')
        e.view.activePageId = 'inconnue'
        expect(selectActivePage(e)?.id).toBe('planche_1')
    })
})
