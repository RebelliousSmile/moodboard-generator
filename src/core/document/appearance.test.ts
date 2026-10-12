import { describe, expect, it } from 'vitest'
import { appearanceVars, captionContent } from './appearance'
import { cellsToRect, effectiveSpacing } from './grid'
import { createEmptyDocument } from './model'
import { DEFAULT_APPEARANCE, parseDocument } from './schema'
import { parseDocumentYaml, serializeDocument } from './yaml'

const legende = { emplacement: 'dessous', descriptif: true, tags: true } as const

describe('apparence : valeurs par défaut et bornes', () => {
    it("remplit toute l'apparence quand le bloc est absent", () => {
        const result = parseDocument({ titre: 'A' })
        expect(result.ok && result.document.apparence).toEqual(DEFAULT_APPEARANCE)
    })

    it('garde les champs reçus et complète les autres', () => {
        const result = parseDocument({
            titre: 'A',
            apparence: { fond: '#000000', legende: { emplacement: 'surimpression' } },
        })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.document.apparence.fond).toBe('#000000')
        expect(result.document.apparence.legende).toEqual({
            emplacement: 'surimpression',
            descriptif: true,
            tags: true,
        })
        expect(result.document.apparence.marge).toBe(32)
    })

    it.each([
        [{ fond: 'rouge' }, 'apparence.fond'],
        [{ arrondi: 99 }, 'apparence.arrondi'],
        [{ taille_texte: 2 }, 'apparence.taille_texte'],
        [{ police: 'comic' }, 'apparence.police'],
        [{ legende: { emplacement: 'ailleurs' } }, 'apparence.legende.emplacement'],
    ])('refuse %j en nommant le champ', (apparence, path) => {
        const result = parseDocument({ titre: 'A', apparence })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.join('\n')).toContain(path)
    })
})

describe('apparence : traduction et légende', () => {
    it('traduit chaque réglage en variable CSS', () => {
        const vars = appearanceVars({
            ...DEFAULT_APPEARANCE,
            legende: { ...DEFAULT_APPEARANCE.legende },
            arrondi: 8,
            fond: '#fafafa',
        }) as Record<string, string>
        expect(vars['--board-bg']).toBe('#fafafa')
        expect(vars['--board-radius']).toBe('8px')
        expect(vars['--board-font']).toContain('Inter')
        expect(vars['--board-font-size']).toBe('13px')
    })

    it('ne montre aucune légende masquée, vide ou désactivée', () => {
        const image = { descriptif: 'Lumière', tags: ['bleu'] }
        expect(captionContent(image, { ...legende, emplacement: 'masquee' })).toBeNull()
        expect(captionContent({ descriptif: '  ', tags: [] }, legende)).toBeNull()
        expect(captionContent(image, { ...legende, descriptif: false, tags: false })).toBeNull()
    })

    it('ne garde que ce que le document active', () => {
        const image = { descriptif: 'Lumière', tags: ['bleu', 'doux'] }
        expect(captionContent(image, legende)).toEqual({
            descriptif: 'Lumière',
            tags: ['bleu', 'doux'],
        })
        expect(captionContent(image, { ...legende, tags: false })).toEqual({
            descriptif: 'Lumière',
            tags: [],
        })
    })
})

describe('apparence : YAML', () => {
    it("restitue l'apparence à l'identique", () => {
        const doc = createEmptyDocument('Essai')
        doc.apparence = {
            ...doc.apparence,
            fond: '#101010',
            arrondi: 12,
            police: 'pt_serif',
            legende: { emplacement: 'surimpression', descriptif: false, tags: true },
        }
        const result = parseDocumentYaml(serializeDocument(doc))
        expect(result.ok && result.document.apparence).toEqual(doc.apparence)
    })
})

describe('marge et gouttière au maximum', () => {
    it('ramène les réglages à ce que la page porte', () => {
        const doc = createEmptyDocument()
        doc.grille = { colonnes: 48, rangees: 48 }
        doc.apparence = { ...doc.apparence, marge: 120, gouttiere: 60 }
        const { marge, gouttiere } = effectiveSpacing(doc)
        expect(marge).toBeLessThanOrEqual(120)
        expect(gouttiere).toBeLessThan(60)
        const first = cellsToRect(doc, { x: 0, y: 0, w: 1, h: 1 })
        const last = cellsToRect(doc, { x: 47, y: 47, w: 1, h: 1 })
        expect(first.width).toBeGreaterThan(0)
        expect(first.height).toBeGreaterThan(0)
        expect(last.left + last.width).toBeLessThanOrEqual(794)
        expect(last.top + last.height).toBeLessThanOrEqual(1123)
    })

    it('laisse intacts des réglages raisonnables', () => {
        expect(effectiveSpacing(createEmptyDocument())).toEqual({ marge: 32, gouttiere: 12 })
    })
})
