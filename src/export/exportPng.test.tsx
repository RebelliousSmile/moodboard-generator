import { createEmptyDocument } from '@/core/document/model'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    snapdom: vi.fn(),
    downloadBlob: vi.fn(),
}))

vi.mock('@zumer/snapdom', () => ({ snapdom: mocks.snapdom }))
vi.mock('./download', () => ({ downloadBlob: mocks.downloadBlob }))
vi.mock('@/editor/board/PageView', () => ({
    PageView: ({ page }: { page: { id: string } }) => <div data-page={page.id} />,
}))

import { exportPagePng, exportPagesPng, PNG_SCALES } from './exportPng'

function capture(warnings: { code: string }[] = []) {
    return { toBlob: vi.fn().mockResolvedValue(new Blob(['png'])), warnings }
}

beforeEach(() => {
    Object.defineProperty(document, 'fonts', {
        value: { ready: Promise.resolve() },
        configurable: true,
    })
})

afterEach(() => {
    mocks.snapdom.mockReset()
    mocks.downloadBlob.mockReset()
})

function twoPageDocument() {
    const doc = createEmptyDocument('Été à Lisbonne')
    doc.planches.push({ id: 'planche_2', titre: '', cadres: [] })
    return doc
}

describe('PNG_SCALES', () => {
    it('propose les échelles ×1, ×2 et ×3', () => {
        expect([...PNG_SCALES]).toEqual([1, 2, 3])
    })
})

describe('exportPagePng', () => {
    it("capture la planche à dpr 1 et télécharge un fichier nommé d'après le titre et le rang", async () => {
        const doc = twoPageDocument()
        mocks.snapdom.mockResolvedValue(capture())

        const substituted = await exportPagePng(doc, doc.planches[1], 2)

        expect(substituted).toBe(0)
        expect(mocks.snapdom).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({ scale: 2, dpr: 1, embedFonts: true })
        )
        const [name, blob] = mocks.downloadBlob.mock.calls[0]
        expect(name).toMatch(/-planche-02@2x\.png$/)
        expect(blob).toBeInstanceOf(Blob)
    })

    it('compte seulement les avertissements image-fallback', async () => {
        const doc = twoPageDocument()
        mocks.snapdom.mockResolvedValue(
            capture([{ code: 'image-fallback' }, { code: 'autre' }, { code: 'image-fallback' }])
        )
        expect(await exportPagePng(doc, doc.planches[0], 1)).toBe(2)
    })

    it('retire la planche montée hors de la vue, même quand la capture échoue', async () => {
        const doc = twoPageDocument()
        mocks.snapdom.mockRejectedValue(new Error('capture impossible'))

        await expect(exportPagePng(doc, doc.planches[0], 1)).rejects.toThrow('capture impossible')

        expect(document.querySelector('[aria-hidden="true"][style*="-100000px"]')).toBeNull()
        expect(mocks.downloadBlob).not.toHaveBeenCalled()
    })
})

describe('exportPagesPng', () => {
    it('télécharge un fichier par planche et cumule les images substituées', async () => {
        const doc = twoPageDocument()
        mocks.snapdom
            .mockResolvedValueOnce(capture([{ code: 'image-fallback' }]))
            .mockResolvedValueOnce(capture())

        const outcome = await exportPagesPng(doc, doc.planches, 1)

        expect(outcome).toEqual({ files: 2, substituted: 1 })
        expect(mocks.downloadBlob).toHaveBeenCalledTimes(2)
    })
})
