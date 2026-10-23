import { describe, expect, it } from 'vitest'
import { PAGE_FORMATS } from './formats'
import { createEmptyDocument, createId } from './model'
import { DEFAULT_APPEARANCE, parseDocument, type AtelierDocument } from './schema'

function sampleDocument(): AtelierDocument {
    return {
        ...createEmptyDocument('Voyage'),
        images: [
            {
                id: 'image_1',
                url: 'https://example.com/a.jpg',
                descriptif: 'Une plage',
                tags: ['mer'],
                focus: { x: 20, y: 80 },
            },
            {
                id: 'image_2',
                url: 'https://example.com/b.jpg',
                descriptif: '',
                tags: [],
                focus: { x: 50, y: 50 },
            },
        ],
        planches: [
            {
                id: 'planche_1',
                titre: 'Ouverture',
                cadres: [{ image: 'image_1', x: 0, y: 0, w: 6, h: 8 }],
            },
        ],
    }
}

function errorsOf(value: unknown): string[] {
    const result = parseDocument(value)
    if (result.ok) throw new Error('le document aurait dû être refusé')
    return result.errors
}

describe('formats', () => {
    it('donne les dimensions en pixels CSS à 96 px par pouce', () => {
        expect(PAGE_FORMATS.a4_portrait).toMatchObject({ widthPx: 794, heightPx: 1123 })
        expect(PAGE_FORMATS.a4_paysage).toMatchObject({ widthPx: 1123, heightPx: 794 })
        expect(PAGE_FORMATS.a3_portrait).toMatchObject({ widthPx: 1123, heightPx: 1587 })
        expect(PAGE_FORMATS.carre).toMatchObject({ widthPx: 794, heightPx: 794 })
        expect(PAGE_FORMATS.ecran_16_9).toMatchObject({ widthPx: 1920, heightPx: 1080 })
    })
})

describe('model', () => {
    it('crée un document vide valide : une planche, grille 12 × 16', () => {
        const doc = createEmptyDocument()
        expect(doc.planches).toHaveLength(1)
        expect(doc.grille).toEqual({ colonnes: 12, rangees: 16 })
        expect(parseDocument(doc)).toEqual({ ok: true, document: doc })
    })

    it('attribue le plus petit identifiant libre', () => {
        expect(createId('image', [])).toBe('image_1')
        expect(createId('image', ['image_1', 'image_3'])).toBe('image_2')
    })
})

describe('parseDocument', () => {
    it('accepte un document complet sans le modifier', () => {
        const doc = sampleDocument()
        expect(parseDocument(doc)).toEqual({ ok: true, document: doc })
    })

    it('restaure les valeurs par défaut des champs optionnels', () => {
        const result = parseDocument({
            titre: 'Minimal',
            images: [{ id: 'image_1', url: 'https://example.com/a.jpg' }],
            planches: [{ id: 'planche_1' }],
        })
        expect(result).toEqual({
            ok: true,
            document: {
                titre: 'Minimal',
                format: 'a4_portrait',
                grille: { colonnes: 12, rangees: 16 },
                apparence: DEFAULT_APPEARANCE,
                images: [
                    {
                        id: 'image_1',
                        url: 'https://example.com/a.jpg',
                        descriptif: '',
                        tags: [],
                        focus: { x: 50, y: 50 },
                    },
                ],
                planches: [{ id: 'planche_1', titre: '', cadres: [] }],
            },
        })
    })

    it('refuse un document sans titre en nommant le champ', () => {
        const doc: Partial<AtelierDocument> = sampleDocument()
        delete doc.titre
        expect(errorsOf(doc)).toEqual(['titre : titre manquant'])
    })

    it('refuse un cadre hors grille en nommant le champ', () => {
        const doc = sampleDocument()
        doc.planches[0].cadres[0] = { image: 'image_1', x: 8, y: 10, w: 6, h: 8 }
        const errors = errorsOf(doc)
        expect(errors).toHaveLength(2)
        expect(errors[0]).toMatch(/^planches\[0\]\.cadres\[0\]\.w : cadre hors grille/)
        expect(errors[1]).toMatch(/^planches\[0\]\.cadres\[0\]\.h : cadre hors grille/)
    })

    it('refuse un cadre pointant une image absente', () => {
        const doc = sampleDocument()
        doc.planches[0].cadres[0].image = 'image_9'
        expect(errorsOf(doc)).toEqual([
            'planches[0].cadres[0].image : image « image_9 » absente du document',
        ])
    })

    it('refuse une image posée deux fois, y compris sur deux planches', () => {
        const doc = sampleDocument()
        doc.planches.push({
            id: 'planche_2',
            titre: '',
            cadres: [{ image: 'image_1', x: 0, y: 0, w: 2, h: 2 }],
        })
        expect(errorsOf(doc)).toEqual([
            'planches[1].cadres[0].image : image « image_1 » déjà posée dans un autre cadre',
        ])
    })

    it('refuse les identifiants en double et ceux qui ne sont pas en snake_case', () => {
        const doc = sampleDocument()
        doc.images[1].id = 'image_1'
        expect(errorsOf(doc)[0]).toMatch(/^images\[1\]\.id : identifiant « image_1 » déjà utilisé/)

        const other = sampleDocument()
        other.images[1].id = 'Image-2'
        expect(errorsOf(other)[0]).toMatch(/^images\[1\]\.id : identifiant attendu en snake_case/)
    })

    it('refuse une marge, une grille ou un format hors bornes', () => {
        expect(errorsOf({ titre: 'x', apparence: { marge: -1 } })[0]).toMatch(
            /^apparence\.marge : /
        )
        expect(errorsOf({ titre: 'x', grille: { colonnes: 0 } })[0]).toMatch(/^grille\.colonnes : /)
        expect(errorsOf({ titre: 'x', format: 'a5' })[0]).toMatch(/^format : format inconnu/)
    })

    it("refuse ce qui n'est pas un document", () => {
        expect(errorsOf(null)).toHaveLength(1)
        expect(errorsOf(['a'])).toHaveLength(1)
        expect(errorsOf('texte')).toHaveLength(1)
    })
})
