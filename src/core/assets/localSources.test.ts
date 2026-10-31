import { beforeEach, describe, expect, it, vi } from 'vitest'

const files = vi.hoisted(() => ({
    store: new Map<string, Map<string, Blob>>(),
}))

vi.mock('./localFiles', () => ({
    saveLocalFile: vi.fn(async (doc: string, image: string, blob: Blob) => {
        if (!files.store.has(doc)) files.store.set(doc, new Map())
        files.store.get(doc)!.set(image, blob)
    }),
    deleteLocalFile: vi.fn(async (doc: string, image: string) => {
        files.store.get(doc)?.delete(image)
    }),
    deleteDocumentFiles: vi.fn(async (doc: string) => {
        files.store.delete(doc)
    }),
    listLocalFiles: vi.fn(async (doc: string) => new Map(files.store.get(doc) ?? [])),
}))

import {
    attachLocalFile,
    copyDocumentFiles,
    detachLocalFile,
    getSources,
    loadDocumentSources,
    localSourceOf,
    purgeDocumentFiles,
    sourceKey,
    subscribeToSources,
} from './localSources'

let counter = 0
const revoked: string[] = []

beforeEach(() => {
    files.store.clear()
    revoked.length = 0
    Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:local/${(counter += 1)}`),
        revokeObjectURL: vi.fn((url: string) => revoked.push(url)),
    })
})

describe('sourceKey', () => {
    it("joint le document et l'image", () => {
        expect(sourceKey('d', 'i')).toBe('d:i')
    })
})

describe('attachLocalFile et detachLocalFile', () => {
    it("publie une adresse locale, la remplace en libérant l'ancienne, puis la retire", async () => {
        const listener = vi.fn()
        const unsubscribe = subscribeToSources(listener)

        await attachLocalFile('d1', 'image_1', new Blob(['a']))
        const first = localSourceOf('d1', 'image_1')
        expect(first).toMatch(/^blob:local\//)
        expect(listener).toHaveBeenCalledTimes(1)

        await attachLocalFile('d1', 'image_1', new Blob(['b']))
        expect(revoked).toContain(first)
        expect(localSourceOf('d1', 'image_1')).not.toBe(first)

        await detachLocalFile('d1', 'image_1')
        expect(localSourceOf('d1', 'image_1')).toBeUndefined()

        unsubscribe()
        await attachLocalFile('d1', 'image_2', new Blob(['c']))
        expect(listener).toHaveBeenCalledTimes(3)
        await purgeDocumentFiles('d1')
    })

    it("ne publie rien en détachant une image qui n'avait pas de fichier", async () => {
        const before = getSources()
        await detachLocalFile('d2', 'inconnue')
        expect(getSources()).toBe(before)
    })
})

describe('loadDocumentSources', () => {
    it('charge les fichiers du document une seule fois', async () => {
        files.store.set('d3', new Map([['image_1', new Blob(['a'])]]))
        await loadDocumentSources('d3')
        const loaded = localSourceOf('d3', 'image_1')
        expect(loaded).toMatch(/^blob:local\//)
        await loadDocumentSources('d3')
        expect(localSourceOf('d3', 'image_1')).toBe(loaded)
        await purgeDocumentFiles('d3')
    })
})

describe('copyDocumentFiles et purgeDocumentFiles', () => {
    it('copie les fichiers vers le document dupliqué, et la purge ne touche que le sien', async () => {
        await attachLocalFile('src', 'image_1', new Blob(['a']))
        await copyDocumentFiles('src', 'copie')
        expect(localSourceOf('copie', 'image_1')).toMatch(/^blob:local\//)

        const kept = localSourceOf('src', 'image_1')
        await purgeDocumentFiles('copie')
        expect(localSourceOf('copie', 'image_1')).toBeUndefined()
        expect(localSourceOf('src', 'image_1')).toBe(kept)
        await purgeDocumentFiles('src')
    })
})
