import type { DocumentImage } from '@/core/document/schema'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    activeId: 'd1' as string | null,
    loadDocumentSources: vi.fn(),
    sources: new Map<string, string>(),
}))

vi.mock('@/core/workspace/store', () => ({
    useWorkspaceStore: (select: (state: { activeId: string | null }) => unknown) =>
        select({ activeId: mocks.activeId }),
}))
vi.mock('./localSources', () => ({
    getSources: () => mocks.sources,
    subscribeToSources: () => () => {},
    sourceKey: (documentId: string, imageId: string) => `${documentId}:${imageId}`,
    loadDocumentSources: mocks.loadDocumentSources,
}))

import { useImageSource } from './useImageSource'

const image: DocumentImage = {
    id: 'image_1',
    url: 'https://example.com/a.jpg',
    descriptif: '',
    tags: [],
    focus: { x: 50, y: 50 },
}

let root: Root
let host: HTMLElement
let seen: { src: string; replaced: boolean } | null

function Probe({ onValue }: { onValue: (value: { src: string; replaced: boolean }) => void }) {
    const value = useImageSource(image)
    useEffect(() => onValue(value))
    return null
}

const record = (value: { src: string; replaced: boolean }) => {
    seen = value
}

beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    mocks.sources.clear()
    mocks.activeId = 'd1'
    host = document.createElement('div')
    root = createRoot(host)
    seen = null
})

afterEach(() => {
    act(() => root.unmount())
    mocks.loadDocumentSources.mockReset()
})

describe('useImageSource', () => {
    it("sert le lien quand aucun fichier local n'existe, et charge les fichiers du document", () => {
        act(() => root.render(<Probe onValue={record} />))
        expect(seen).toEqual({ src: image.url, replaced: false })
        expect(mocks.loadDocumentSources).toHaveBeenCalledWith('d1')
    })

    it('sert le fichier local quand il existe', () => {
        mocks.sources.set('d1:image_1', 'blob:local/1')
        act(() => root.render(<Probe onValue={record} />))
        expect(seen).toEqual({ src: 'blob:local/1', replaced: true })
    })

    it('sert le lien et ne charge rien sans document actif', () => {
        mocks.activeId = null
        act(() => root.render(<Probe onValue={record} />))
        expect(seen).toEqual({ src: image.url, replaced: false })
        expect(mocks.loadDocumentSources).not.toHaveBeenCalled()
    })
})
