import { describe, expect, it } from 'vitest'
import { addImages, unplacedImages } from './images'
import { createEmptyDocument } from './model'
import {
    addPage,
    applySettings,
    movePage,
    overflowingFrames,
    placeFrame,
    removeFrame,
    removePage,
    renamePage,
    setFrameCells,
} from './pages'
import { parseDocument, type AtelierDocument } from './schema'

function documentWithImages(count: number): AtelierDocument {
    const inputs = Array.from({ length: count }, (_, index) => ({
        url: `https://example.com/${index + 1}.jpg`,
    }))
    return addImages(createEmptyDocument('Essai'), inputs).doc
}

function place(doc: AtelierDocument, imageId: string, x?: number, y?: number): AtelierDocument {
    const result = placeFrame(doc, 'planche_1', imageId, x === undefined ? undefined : { x, y: y ?? 0 })
    if (!result.ok) throw new Error(result.reason)
    return result.doc
}

describe('planches', () => {
    it('ajoute, renomme et réordonne des planches', () => {
        let doc = documentWithImages(0)
        const added = addPage(doc)
        doc = added.doc
        expect(added.id).toBe('planche_2')
        doc = renamePage(doc, 'planche_2', 'Détails')
        expect(doc.planches[1].titre).toBe('Détails')
        doc = movePage(doc, 'planche_2', 0)
        expect(doc.planches.map((page) => page.id)).toEqual(['planche_2', 'planche_1'])
    })

    it('rend les images d’une planche supprimée à la réserve', () => {
        let doc = documentWithImages(2)
        doc = place(doc, 'image_1')
        doc = place(doc, 'image_2')
        expect(unplacedImages(doc)).toHaveLength(0)
        doc = removePage(doc, 'planche_1')
        expect(unplacedImages(doc).map((image) => image.id)).toEqual(['image_1', 'image_2'])
    })
})

describe('cadres', () => {
    it('pose un cadre accroché à la grille, au premier emplacement libre sans cible', () => {
        const doc = place(documentWithImages(2), 'image_1')
        expect(doc.planches[0].cadres[0]).toEqual({ image: 'image_1', x: 0, y: 0, w: 4, h: 4 })
        const second = place(doc, 'image_2')
        expect(second.planches[0].cadres[1]).toMatchObject({ x: 4, y: 0 })
    })

    it('refuse une image déjà posée et une planche pleine', () => {
        const doc = place(documentWithImages(1), 'image_1')
        expect(placeFrame(doc, 'planche_1', 'image_1')).toEqual({
            ok: false,
            reason: 'image déjà posée',
        })

        let full = documentWithImages(13)
        full = { ...full, grille: { colonnes: 2, rangees: 2 } }
        const span = { w: 2, h: 2 }
        const first = placeFrame(full, 'planche_1', 'image_1', undefined, span)
        expect(first.ok).toBe(true)
        if (first.ok) {
            const second = placeFrame(first.doc, 'planche_1', 'image_2', undefined, span)
            expect(second.ok).toBe(false)
        }
    })

    it('refuse un déplacement qui chevauche ou sort de la grille', () => {
        let doc = documentWithImages(2)
        doc = place(doc, 'image_1')
        doc = place(doc, 'image_2')
        const overlapping = setFrameCells(doc, 'planche_1', 'image_2', { x: 2, y: 0, w: 4, h: 4 })
        expect(overlapping.ok).toBe(false)
        const outside = setFrameCells(doc, 'planche_1', 'image_2', { x: 10, y: 0, w: 4, h: 4 })
        expect(outside.ok).toBe(false)
        expect(doc.planches[0].cadres[1]).toMatchObject({ x: 4, y: 0 })
    })

    it('garde le vide laissé après un déplacement : rien ne se tasse', () => {
        let doc = documentWithImages(2)
        doc = place(doc, 'image_1')
        doc = place(doc, 'image_2')
        const moved = setFrameCells(doc, 'planche_1', 'image_2', { x: 4, y: 8, w: 4, h: 4 })
        expect(moved.ok).toBe(true)
        if (!moved.ok) return
        const removed = removeFrame(moved.doc, 'image_1')
        expect(removed.planches[0].cadres).toEqual([{ image: 'image_2', x: 4, y: 8, w: 4, h: 4 }])
    })

    it('ne produit jamais deux cadres sur une même cellule, quelle que soit la suite', () => {
        let doc = documentWithImages(6)
        const moves: [string, number, number, number, number][] = [
            ['image_2', 0, 0, 4, 4],
            ['image_3', 2, 2, 4, 4],
            ['image_4', 8, 0, 6, 2],
            ['image_5', 4, 4, 8, 8],
            ['image_6', 0, 12, 12, 4],
        ]
        for (const id of ['image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6']) {
            doc = place(doc, id)
        }
        for (const [id, x, y, w, h] of moves) {
            const result = setFrameCells(doc, 'planche_1', id, { x, y, w, h })
            if (result.ok) doc = result.doc
        }
        // Le schéma rejette les cadres hors grille ; les chevauchements sont écartés par construction.
        expect(parseDocument(doc).ok).toBe(true)
        const frames = doc.planches[0].cadres
        for (let i = 0; i < frames.length; i += 1) {
            for (let j = i + 1; j < frames.length; j += 1) {
                const a = frames[i]
                const b = frames[j]
                const overlap =
                    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
                expect(overlap).toBe(false)
            }
        }
    })
})

describe('format et grille', () => {
    it('nomme les cadres qui déborderaient et refuse sans confirmation', () => {
        let doc = documentWithImages(2)
        doc = place(doc, 'image_1', 0, 0)
        doc = place(doc, 'image_2', 8, 0)
        expect(overflowingFrames(doc, { colonnes: 8, rangees: 16 })).toEqual([
            { pageId: 'planche_1', imageId: 'image_2' },
        ])
        expect(applySettings(doc, { grille: { colonnes: 8 } }).ok).toBe(false)
    })

    it('retire les cadres qui débordent quand le changement est confirmé', () => {
        let doc = documentWithImages(2)
        doc = place(doc, 'image_1', 0, 0)
        doc = place(doc, 'image_2', 8, 0)
        const result = applySettings(doc, { grille: { colonnes: 8 }, format: 'a3_paysage' }, true)
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.doc.format).toBe('a3_paysage')
        expect(result.doc.planches[0].cadres.map((frame) => frame.image)).toEqual(['image_1'])
        expect(unplacedImages(result.doc).map((image) => image.id)).toEqual(['image_2'])
    })

    it('change le format sans toucher aux cadres', () => {
        const doc = place(documentWithImages(1), 'image_1')
        const result = applySettings(doc, { format: 'carre' })
        expect(result.ok && result.doc.planches[0].cadres).toEqual(doc.planches[0].cadres)
    })
})
