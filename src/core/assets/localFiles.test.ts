// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
    deleteDocumentFiles,
    deleteLocalFile,
    listLocalFiles,
    readLocalFile,
    saveLocalFile,
} from './localFiles'

// Environnement Node : le Blob de jsdom ne survit pas au clonage structuré de fake-indexeddb.
const blob = (text: string) => new Blob([text], { type: 'image/png' })

describe('localFiles', () => {
    it('relit un fichier enregistré pour une image', async () => {
        await saveLocalFile('doc-a', 'img-1', blob('un'))
        const stored = await readLocalFile('doc-a', 'img-1')
        expect(stored?.size).toBe(2)
    })

    it('rend null pour une image sans fichier', async () => {
        expect(await readLocalFile('doc-a', 'absente')).toBeNull()
    })

    it('distingue deux documents qui portent le même identifiant d’image', async () => {
        await saveLocalFile('doc-b', 'img-1', blob('b'))
        await saveLocalFile('doc-c', 'img-1', blob('ccc'))
        expect((await readLocalFile('doc-b', 'img-1'))?.size).toBe(1)
        expect((await readLocalFile('doc-c', 'img-1'))?.size).toBe(3)
    })

    it('remplace le fichier d’une image enregistrée deux fois', async () => {
        await saveLocalFile('doc-d', 'img-1', blob('x'))
        await saveLocalFile('doc-d', 'img-1', blob('xxxx'))
        expect((await readLocalFile('doc-d', 'img-1'))?.size).toBe(4)
        expect((await listLocalFiles('doc-d')).size).toBe(1)
    })

    it('supprime le fichier d’une seule image', async () => {
        await saveLocalFile('doc-e', 'img-1', blob('1'))
        await saveLocalFile('doc-e', 'img-2', blob('2'))
        await deleteLocalFile('doc-e', 'img-1')
        expect([...(await listLocalFiles('doc-e')).keys()]).toEqual(['img-2'])
    })

    it('purge tous les fichiers d’un document sans toucher aux autres', async () => {
        await saveLocalFile('doc-f', 'img-1', blob('1'))
        await saveLocalFile('doc-f', 'img-2', blob('2'))
        await saveLocalFile('doc-g', 'img-1', blob('3'))
        await deleteDocumentFiles('doc-f')
        expect((await listLocalFiles('doc-f')).size).toBe(0)
        expect((await listLocalFiles('doc-g')).size).toBe(1)
    })
})
