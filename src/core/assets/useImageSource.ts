import type { DocumentImage } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import { useEffect, useSyncExternalStore } from 'react'
import { getSources, loadDocumentSources, sourceKey, subscribeToSources } from './localSources'

/** La source effective d'une image : son fichier local s'il existe, son lien sinon. */
export function useImageSource(image: DocumentImage): { src: string; replaced: boolean } {
    const documentId = useWorkspaceStore((state) => state.activeId)
    const sources = useSyncExternalStore(subscribeToSources, getSources)

    useEffect(() => {
        if (documentId) void loadDocumentSources(documentId)
    }, [documentId])

    const local = documentId ? sources.get(sourceKey(documentId, image.id)) : undefined
    return { src: local ?? image.url, replaced: local !== undefined }
}
