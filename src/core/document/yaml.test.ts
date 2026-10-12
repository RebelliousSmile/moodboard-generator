import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './model'
import { DEFAULT_APPEARANCE, type AtelierDocument } from './schema'
import { parseDocumentYaml, serializeDocument, yamlFileName } from './yaml'

function sampleDocument(): AtelierDocument {
    return {
        titre: 'Été à Lisbonne : « azulejos »',
        format: 'a3_paysage',
        grille: { colonnes: 10, rangees: 8 },
        apparence: {
            ...DEFAULT_APPEARANCE,
            legende: { ...DEFAULT_APPEARANCE.legende },
            marge: 40,
            gouttiere: 6.5,
        },
        images: [
            {
                id: 'image_1',
                url: 'https://example.com/a.jpg?sig=abc&x=1#frag',
                descriptif: 'Façade bleue\nsur deux lignes',
                tags: ['ville', 'bleu: clair', '123'],
                focus: { x: 12.5, y: 100 },
            },
            {
                id: 'image_2',
                url: 'https://example.com/b.png',
                descriptif: '',
                tags: [],
                focus: { x: 50, y: 50 },
            },
        ],
        planches: [
            {
                id: 'planche_1',
                titre: 'Ouverture',
                cadres: [
                    { image: 'image_1', x: 0, y: 0, w: 5, h: 8 },
                    { image: 'image_2', x: 5, y: 2, w: 5, h: 4 },
                ],
            },
            { id: 'planche_2', titre: '', cadres: [] },
        ],
    }
}

describe('yaml', () => {
    it('restitue un document identique champ pour champ après un aller-retour', () => {
        const doc = sampleDocument()
        expect(parseDocumentYaml(serializeDocument(doc))).toEqual({
            ok: true,
            document: doc,
        })
    })

    it('restitue un document vide à l’identique', () => {
        const doc = createEmptyDocument()
        expect(parseDocumentYaml(serializeDocument(doc))).toEqual({
            ok: true,
            document: doc,
        })
    })

    it("écrit les clés dans un ordre constant, quel que soit l'ordre en mémoire", () => {
        const doc = sampleDocument()
        const shuffled = {
            planches: doc.planches,
            images: doc.images.map(({ id, url, descriptif, tags, focus }) => ({
                focus,
                tags,
                descriptif,
                url,
                id,
            })),
            apparence: doc.apparence,
            grille: doc.grille,
            format: doc.format,
            titre: doc.titre,
        } as AtelierDocument
        const text = serializeDocument(shuffled)
        expect(text).toBe(serializeDocument(doc))
        expect(text.indexOf('titre:')).toBe(0)
        expect(text.indexOf('images:')).toBeLessThan(text.indexOf('planches:'))
    })

    it('lit une clé laissée vide comme un champ absent', () => {
        const result = parseDocumentYaml(
            [
                'titre: Brouillon',
                'images:',
                '  - id: image_1',
                '    url: https://example.com/a.jpg',
                '    descriptif:',
                '    tags:',
                'planches:',
            ].join('\n')
        )
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.document.images[0].descriptif).toBe('')
        expect(result.document.images[0].tags).toEqual([])
        expect(result.document.planches).toEqual([])
    })

    it('refuse un fichier sans titre en nommant le champ', () => {
        expect(parseDocumentYaml('format: a4_portrait\n')).toEqual({
            ok: false,
            errors: ['titre : titre manquant'],
        })
    })

    it('refuse un cadre invalide en nommant le champ', () => {
        const result = parseDocumentYaml(
            [
                'titre: Test',
                'images:',
                '  - id: image_1',
                '    url: https://example.com/a.jpg',
                'planches:',
                '  - id: planche_1',
                '    cadres:',
                '      - { image: image_1, x: 10, y: 0, w: 4, h: 2 }',
                '      - { image: image_1, x: 0, y: 0, w: 2, h: 2 }',
                '      - { image: inconnue, x: 2, y: 0, w: 2, h: 2 }',
            ].join('\n')
        )
        expect(result).toEqual({
            ok: false,
            errors: [
                'planches[0].cadres[0].w : cadre hors grille : x + w dépasse les 12 colonnes',
                'planches[0].cadres[1].image : image « image_1 » déjà posée dans un autre cadre',
                'planches[0].cadres[2].image : image « inconnue » absente du document',
            ],
        })
    })

    it('signale un YAML illisible et un fichier vide', () => {
        const broken = parseDocumentYaml('titre: [oups')
        expect(broken.ok).toBe(false)
        if (!broken.ok) expect(broken.errors[0]).toMatch(/^YAML illisible : /)
        expect(parseDocumentYaml('').ok).toBe(false)
    })

    it('tire le nom du fichier du titre', () => {
        expect(yamlFileName('Été à Lisbonne : « azulejos »')).toBe('ete-a-lisbonne-azulejos.yaml')
        expect(yamlFileName('  ???  ')).toBe('document.yaml')
    })
})
