import { describe, expect, it } from 'vitest'
import { FORMAT_IDS, PAGE_FORMATS, getPageFormat, mmToPx } from './formats'

describe('mmToPx', () => {
    it('convertit à 96 px par pouce, arrondi au pixel', () => {
        expect(mmToPx(25.4)).toBe(96)
        expect(mmToPx(210)).toBe(794)
        expect(mmToPx(297)).toBe(1123)
    })
})

describe('PAGE_FORMATS', () => {
    it('décrit chaque identifiant déclaré', () => {
        expect(Object.keys(PAGE_FORMATS).sort()).toEqual([...FORMAT_IDS].sort())
        for (const id of FORMAT_IDS) expect(getPageFormat(id).id).toBe(id)
    })

    it('donne A4 794 × 1123 px', () => {
        expect(PAGE_FORMATS.a4_portrait).toMatchObject({ widthPx: 794, heightPx: 1123 })
        expect(PAGE_FORMATS.a4_paysage).toMatchObject({ widthPx: 1123, heightPx: 794 })
    })

    it("donne à l'écran 16:9 exactement 1920 × 1080 px", () => {
        expect(PAGE_FORMATS.ecran_16_9).toMatchObject({ widthPx: 1920, heightPx: 1080 })
    })

    it("garde l'écart d'arrondi sous un demi-pixel pour chaque format", () => {
        for (const format of Object.values(PAGE_FORMATS)) {
            const exactW = (format.widthMm * 96) / 25.4
            const exactH = (format.heightMm * 96) / 25.4
            expect(Math.abs(format.widthPx - exactW)).toBeLessThanOrEqual(0.5)
            expect(Math.abs(format.heightPx - exactH)).toBeLessThanOrEqual(0.5)
        }
    })
})
