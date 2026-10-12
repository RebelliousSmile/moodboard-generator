import {
    deleteDocumentFiles,
    deleteLocalFile,
    listLocalFiles,
    saveLocalFile,
} from './localFiles'

/**
 * Les fichiers locaux d'un document, prêts à s'afficher : une adresse temporaire par image.
 * Le registre est un instantané immuable, remplacé à chaque changement, pour se brancher sur
 * `useSyncExternalStore`.
 */
type Sources = ReadonlyMap<string, string>

let sources: Sources = new Map()
const loadedDocuments = new Set<string>()
const listeners = new Set<() => void>()

export function sourceKey(documentId: string, imageId: string): string {
    return `${documentId}:${imageId}`
}

function publish(next: Sources) {
    sources = next
    listeners.forEach((listener) => listener())
}

export function subscribeToSources(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function getSources(): Sources {
    return sources
}

/** L'adresse du fichier local d'une image, ou `undefined` si elle est servie par son lien. */
export function localSourceOf(documentId: string, imageId: string): string | undefined {
    return sources.get(sourceKey(documentId, imageId))
}

export async function loadDocumentSources(documentId: string): Promise<void> {
    if (loadedDocuments.has(documentId)) return
    loadedDocuments.add(documentId)
    try {
        const files = await listLocalFiles(documentId)
        if (files.size === 0) return
        const next = new Map(sources)
        files.forEach((blob, imageId) => {
            const key = sourceKey(documentId, imageId)
            if (!next.has(key)) next.set(key, URL.createObjectURL(blob))
        })
        publish(next)
    } catch (error) {
        // Le stockage du navigateur est indisponible : les liens servent, un nouvel essai reste possible.
        loadedDocuments.delete(documentId)
        console.error('Fichiers locaux illisibles', error)
    }
}

export async function attachLocalFile(
    documentId: string,
    imageId: string,
    file: Blob
): Promise<void> {
    await saveLocalFile(documentId, imageId, file)
    const key = sourceKey(documentId, imageId)
    const next = new Map(sources)
    const previous = next.get(key)
    if (previous) URL.revokeObjectURL(previous)
    next.set(key, URL.createObjectURL(file))
    publish(next)
}

export async function detachLocalFile(documentId: string, imageId: string): Promise<void> {
    await deleteLocalFile(documentId, imageId)
    const key = sourceKey(documentId, imageId)
    const previous = sources.get(key)
    if (previous === undefined) return
    URL.revokeObjectURL(previous)
    const next = new Map(sources)
    next.delete(key)
    publish(next)
}

/** Les fichiers d'un document dupliqué suivent la copie. */
export async function copyDocumentFiles(fromId: string, toId: string): Promise<void> {
    const files = await listLocalFiles(fromId)
    const next = new Map(sources)
    for (const [imageId, blob] of files) {
        await saveLocalFile(toId, imageId, blob)
        next.set(sourceKey(toId, imageId), URL.createObjectURL(blob))
    }
    loadedDocuments.add(toId)
    if (files.size > 0) publish(next)
}

export async function purgeDocumentFiles(documentId: string): Promise<void> {
    await deleteDocumentFiles(documentId)
    loadedDocuments.delete(documentId)
    const prefix = `${documentId}:`
    const next = new Map(sources)
    for (const [key, url] of sources) {
        if (!key.startsWith(prefix)) continue
        URL.revokeObjectURL(url)
        next.delete(key)
    }
    if (next.size !== sources.size) publish(next)
}
