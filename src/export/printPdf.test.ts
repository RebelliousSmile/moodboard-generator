import { createEmptyDocument } from '@/core/document/model'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    canLoadImage: vi.fn(),
    warning: vi.fn(),
}))

vi.mock('@/core/assets/canLoadImage', () => ({ canLoadImage: mocks.canLoadImage }))
vi.mock('sonner', () => ({ toast: { warning: mocks.warning } }))

import { printPdf } from './printPdf'

afterEach(() => {
    vi.restoreAllMocks()
    mocks.canLoadImage.mockReset()
    mocks.warning.mockReset()
})

function documentWithPlacedImage(format: 'a4_portrait' | 'a3_paysage') {
    const doc = createEmptyDocument('Voyage')
    doc.format = format
    doc.images.push({
        id: 'image_1',
        url: 'https://example.com/a.jpg',
        descriptif: 'Une plage',
        tags: [],
        focus: { x: 50, y: 50 },
    })
    doc.planches[0].cadres.push({ image: 'image_1', x: 0, y: 0, w: 6, h: 8 })
    return doc
}

describe('printPdf', () => {
    it('déclare la taille de page en millimètres sans marge, puis imprime', async () => {
        mocks.canLoadImage.mockResolvedValue(true)
        const print = vi.spyOn(window, 'print').mockImplementation(() => {})

        await printPdf('d1', documentWithPlacedImage('a3_paysage'))

        const style = document.getElementById('atelier-print-page-size')
        expect(style?.textContent).toBe('@page { size: 420mm 297mm; margin: 0; }')
        expect(print).toHaveBeenCalledTimes(1)
        expect(mocks.warning).not.toHaveBeenCalled()
    })

    it('réutilise la même balise de style au second appel', async () => {
        mocks.canLoadImage.mockResolvedValue(true)
        vi.spyOn(window, 'print').mockImplementation(() => {})

        await printPdf('d1', documentWithPlacedImage('a4_portrait'))
        await printPdf('d1', documentWithPlacedImage('a3_paysage'))

        expect(document.querySelectorAll('#atelier-print-page-size')).toHaveLength(1)
    })

    it("signale une image qui ne se charge pas, avant d'imprimer", async () => {
        mocks.canLoadImage.mockResolvedValue(false)
        const print = vi.spyOn(window, 'print').mockImplementation(() => {})

        await printPdf('d1', documentWithPlacedImage('a4_portrait'))

        expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('Une plage'))
        expect(print).toHaveBeenCalledTimes(1)
    })

    it('signale une planche sans image', async () => {
        vi.spyOn(window, 'print').mockImplementation(() => {})

        await printPdf('d1', createEmptyDocument('Vide'))

        expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('1'))
    })
})
