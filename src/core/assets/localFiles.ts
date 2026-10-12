const DATABASE_NAME = 'atelier-local-files'
const STORE_NAME = 'files'
const DOCUMENT_INDEX = 'documentId'

interface LocalFileRecord {
    key: string
    documentId: string
    imageId: string
    blob: Blob
}

function recordKey(documentId: string, imageId: string): string {
    return `${documentId}:${imageId}`
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1)
        request.onupgradeneeded = () => {
            const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
            store.createIndex(DOCUMENT_INDEX, 'documentId')
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

/** Exécute une opération dans une transaction et attend sa fin, pas seulement sa requête. */
async function withStore<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    const database = await openDatabase()
    try {
        return await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, mode)
            const request = operation(transaction.objectStore(STORE_NAME))
            transaction.oncomplete = () => resolve(request.result)
            transaction.onerror = () => reject(transaction.error)
            transaction.onabort = () => reject(transaction.error)
        })
    } finally {
        database.close()
    }
}

export async function saveLocalFile(
    documentId: string,
    imageId: string,
    blob: Blob
): Promise<void> {
    const record: LocalFileRecord = {
        key: recordKey(documentId, imageId),
        documentId,
        imageId,
        blob,
    }
    await withStore('readwrite', (store) => store.put(record))
}

export async function readLocalFile(documentId: string, imageId: string): Promise<Blob | null> {
    const record = await withStore<LocalFileRecord | undefined>('readonly', (store) =>
        store.get(recordKey(documentId, imageId))
    )
    return record?.blob ?? null
}

export async function deleteLocalFile(documentId: string, imageId: string): Promise<void> {
    await withStore('readwrite', (store) => store.delete(recordKey(documentId, imageId)))
}

/** Les fichiers d'un document, par identifiant d'image. */
export async function listLocalFiles(documentId: string): Promise<Map<string, Blob>> {
    const records = await withStore<LocalFileRecord[]>('readonly', (store) =>
        store.index(DOCUMENT_INDEX).getAll(documentId)
    )
    return new Map(records.map((record) => [record.imageId, record.blob]))
}

export async function deleteDocumentFiles(documentId: string): Promise<void> {
    const database = await openDatabase()
    try {
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite')
            const request = transaction
                .objectStore(STORE_NAME)
                .index(DOCUMENT_INDEX)
                .openKeyCursor(IDBKeyRange.only(documentId))
            request.onsuccess = () => {
                const cursor = request.result
                if (!cursor) return
                transaction.objectStore(STORE_NAME).delete(cursor.primaryKey)
                cursor.continue()
            }
            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
            transaction.onabort = () => reject(transaction.error)
        })
    } finally {
        database.close()
    }
}
