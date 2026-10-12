import { describe, expect, it } from 'vitest'
import {
    addImage,
    addImages,
    normalizeTags,
    removeImage,
    unplacedImages,
    updateImage,
} from './images'
import { createEmptyDocument } from './model'
import { parseDocument, type AtelierDocument } from './schema'
import { parseDocumentYaml, serializeDocument } from './yaml'

function documentWithTwoImages(): AtelierDocument {
    const { doc } = addImages(createEmptyDocument('Voyage'), [
        { url: 'https://example.com/a.jpg', descriptif: 'Une plage', tags: ['mer'] },
        { url: 'https://example.com/b.jpg' },
    ])
    doc.planches[0].cadres.push({ image: 'image_1', x: 0, y: 0, w: 6, h: 8 })
    return doc
}

describe('normalizeTags', () => {
    it('rogne les espaces, écarte les vides et retire les doublons', () => {
        expect(normalizeTags(['  mer ', '', 'ciel', 'mer', '   '])).toEqual(['mer', 'ciel'])
    })
})

describe('addImage', () => {
    it('génère un identifiant libre et centre le focus', () => {
        const { doc, id } = addImage(documentWithTwoImages(), {
            url: ' https://example.com/c.jpg ',
            tags: ['a', 'a '],
        })
        expect(id).toBe('image_3')
        expect(doc.images[2]).toEqual({
            id: 'image_3',
            url: 'https://example.com/c.jpg',
            descriptif: '',
            tags: ['a'],
            focus: { x: 50, y: 50 },
        })
    })

    it("accepte une image vide, que le schéma valide et que l'export garde", () => {
        const { doc } = addImage(createEmptyDocument())
        expect(doc.images[0].url).toBe('')
        expect(parseDocument(doc)).toEqual({ ok: true, document: doc })
        expect(parseDocumentYaml(serializeDocument(doc))).toEqual({ ok: true, document: doc })
    })

    it('fait apparaître lien, descriptif et tags dans le fichier YAML', () => {
        const { doc } = addImage(createEmptyDocument(), {
            url: 'https://example.com/a.jpg',
            descriptif: 'Une plage',
            tags: ['mer', 'sable'],
        })
        const yaml = serializeDocument(doc)
        expect(yaml).toContain('url: https://example.com/a.jpg')
        expect(yaml).toContain('descriptif: Une plage')
        expect(yaml).toContain('- mer')
        expect(yaml).toContain('- sable')
    })

    it('ne modifie pas le document reçu', () => {
        const before = createEmptyDocument()
        addImage(before, { url: 'https://example.com/a.jpg' })
        expect(before.images).toEqual([])
    })
})

describe('updateImage', () => {
    it('applique une modification partielle et normalise les tags', () => {
        const doc = updateImage(documentWithTwoImages(), 'image_1', {
            descriptif: 'Une crique',
            tags: [' mer', 'mer', 'roche'],
        })
        expect(doc.images[0]).toMatchObject({
            url: 'https://example.com/a.jpg',
            descriptif: 'Une crique',
            tags: ['mer', 'roche'],
        })
        expect(doc.images[1].descriptif).toBe('')
    })

    it('rend le même document pour une image inconnue', () => {
        const doc = documentWithTwoImages()
        expect(updateImage(doc, 'image_9', { descriptif: 'x' })).toBe(doc)
    })
})

describe('removeImage', () => {
    it("retire l'image et le cadre qui la portait", () => {
        const doc = removeImage(documentWithTwoImages(), 'image_1')
        expect(doc.images.map((image) => image.id)).toEqual(['image_2'])
        expect(doc.planches[0].cadres).toEqual([])
        expect(parseDocument(doc).ok).toBe(true)
    })
})

describe('unplacedImages', () => {
    it('ne garde que les images posées sur aucune planche', () => {
        expect(unplacedImages(documentWithTwoImages()).map((image) => image.id)).toEqual([
            'image_2',
        ])
    })
})
