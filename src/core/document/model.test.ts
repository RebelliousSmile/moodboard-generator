import { describe, expect, it } from 'vitest'
import { DEFAULT_FORMAT } from './formats'
import { DEFAULT_DOCUMENT_TITLE, createEmptyDocument, createEmptyPage, createId } from './model'
import { parseDocument } from './schema'

describe('createId', () => {
    it('prend le plus petit numéro libre', () => {
        expect(createId('image', [])).toBe('image_1')
        expect(createId('image', ['image_1', 'image_3'])).toBe('image_2')
    })
})

describe('createEmptyPage', () => {
    it('évite les identifiants déjà pris', () => {
        expect(createEmptyPage(['planche_1'])).toEqual({ id: 'planche_2', titre: '', cadres: [] })
    })
})

describe('createEmptyDocument', () => {
    it('remplace un titre vide par le titre par défaut', () => {
        expect(createEmptyDocument('   ').titre).toBe(DEFAULT_DOCUMENT_TITLE)
        expect(createEmptyDocument(' Été ').titre).toBe('Été')
    })

    it('produit un document valide, à une planche vide', () => {
        const doc = createEmptyDocument('Voyage')
        expect(doc.format).toBe(DEFAULT_FORMAT)
        expect(doc.images).toEqual([])
        expect(doc.planches).toHaveLength(1)
        expect(() => parseDocument(doc)).not.toThrow()
    })

    it('ne partage aucun objet avec les valeurs par défaut', () => {
        const a = createEmptyDocument('a')
        const b = createEmptyDocument('b')
        a.grille.colonnes = 1
        a.apparence.legende.descriptif = !a.apparence.legende.descriptif
        expect(b.grille.colonnes).not.toBe(1)
        expect(b.apparence.legende.descriptif).not.toBe(a.apparence.legende.descriptif)
    })
})
