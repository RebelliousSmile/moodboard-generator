import { describe, expect, it } from 'vitest'
import { parseImageList } from './listImport'

describe('parseImageList', () => {
    it('lit une liste YAML au nouveau format', () => {
        const result = parseImageList(`
- url: https://example.com/a.jpg
  descriptif: Une plage
  tags: [mer, " sable ", mer]
- url: https://example.com/b.jpg
`)
        expect(result).toEqual({
            ok: true,
            images: [
                {
                    url: 'https://example.com/a.jpg',
                    descriptif: 'Une plage',
                    tags: ['mer', 'sable'],
                },
                { url: 'https://example.com/b.jpg', descriptif: '', tags: [] },
            ],
            ignored: [],
            duplicates: [],
        })
    })

    it('lit du JSON, sous une clé images', () => {
        const result = parseImageList(
            JSON.stringify({
                images: [{ url: 'https://example.com/a.jpg', description: 'Vue' }],
            })
        )
        expect(result).toMatchObject({
            ok: true,
            images: [{ url: 'https://example.com/a.jpg', descriptif: 'Vue', tags: [] }],
        })
    })

    it("accepte une liste de l'ancien outil : lieu devient le descriptif, les entrées sans url sont ignorées", () => {
        const result = parseImageList(
            JSON.stringify({
                scenario: 'Gashadokuro',
                images: [
                    {
                        id: 1,
                        theme: 'lieu_emblematique',
                        url: 'https://example.com/nagasaki.jpg',
                        lieu: 'Nagasaki, Japon',
                        date: '9 aout 1945',
                        taille: 'full',
                        tags: ['disparus', 'origine'],
                        exclure: ['tourisme'],
                        hotlink_safe: false,
                    },
                    { id: 2, theme: 'detail_texture', lieu: 'Goto', tags: ['pierre'] },
                    { id: 3, url: 'pas un lien', lieu: 'Ailleurs' },
                ],
            })
        )
        expect(result).toEqual({
            ok: true,
            images: [
                {
                    url: 'https://example.com/nagasaki.jpg',
                    descriptif: 'Nagasaki, Japon',
                    tags: ['disparus', 'origine'],
                },
            ],
            ignored: [
                { position: 2, reason: 'pas de lien (url)' },
                { position: 3, reason: 'lien mal formé : pas un lien' },
            ],
            duplicates: [],
        })
    })

    it('signale les liens déjà présents dans le document ou répétés dans la liste', () => {
        const result = parseImageList(
            `
- url: https://example.com/a.jpg
- url: https://example.com/b.jpg
- url: https://example.com/b.jpg
`,
            ['https://example.com/a.jpg']
        )
        expect(result).toMatchObject({
            ok: true,
            images: [{ url: 'https://example.com/b.jpg' }],
            duplicates: [
                { position: 1, url: 'https://example.com/a.jpg' },
                { position: 3, url: 'https://example.com/b.jpg' },
            ],
        })
    })

    it('lit des liens nus, un par ligne, en ignorant les lignes vides', () => {
        const result = parseImageList(`
https://example.com/a.jpg

  https://example.com/b.jpg
pas un lien
https://example.com/a.jpg
`)
        expect(result).toEqual({
            ok: true,
            images: [
                { url: 'https://example.com/a.jpg', descriptif: '', tags: [] },
                { url: 'https://example.com/b.jpg', descriptif: '', tags: [] },
            ],
            ignored: [{ position: 3, reason: 'lien mal formé : pas un lien' }],
            duplicates: [{ position: 4, url: 'https://example.com/a.jpg' }],
        })
    })

    it('lit un seul lien nu, et une liste YAML de liens', () => {
        expect(parseImageList('https://example.com/a.jpg')).toMatchObject({
            ok: true,
            images: [{ url: 'https://example.com/a.jpg' }],
        })
        expect(
            parseImageList('- https://example.com/a.jpg\n- https://example.com/b.jpg')
        ).toMatchObject({
            ok: true,
            images: [{ url: 'https://example.com/a.jpg' }, { url: 'https://example.com/b.jpg' }],
        })
    })

    it('refuse un texte illisible ou sans liste', () => {
        for (const text of ['', 'bonjour tout le monde', '{ url: [', 'titre: seul', '42']) {
            const result = parseImageList(text)
            expect(result.ok, text).toBe(false)
            if (!result.ok) expect(result.error).not.toBe('')
        }
    })
})
