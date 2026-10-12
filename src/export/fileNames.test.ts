import { describe, expect, it } from 'vitest'
import { pngFileName } from './fileNames'

describe('pngFileName', () => {
    it('numérote la planche sur deux chiffres et note l’échelle', () => {
        expect(pngFileName('Été 2026', 3, 2)).toBe('ete-2026-planche-03@2x.png')
    })

    it('retire ce que le système de fichiers refuse', () => {
        expect(pngFileName('a/b:c*?"<>|', 12, 1)).toBe('a-b-c-planche-12@1x.png')
    })

    it('se replie sur un nom neutre quand le titre ne laisse rien', () => {
        expect(pngFileName('???', 1, 3)).toBe('moodboard-planche-01@3x.png')
    })
})
