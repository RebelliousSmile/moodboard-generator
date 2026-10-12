import { canLoadImage } from '@/core/assets/canLoadImage'
import { localSourceOf } from '@/core/assets/localSources'
import { getPageFormat } from '@/core/document/formats'
import type { AtelierDocument } from '@/core/document/schema'
import { toast } from 'sonner'

const STYLE_ID = 'atelier-print-page-size'

/** Les images posées dont la source (fichier local ou lien) ne s'affiche pas. */
async function findBrokenImages(documentId: string, doc: AtelierDocument): Promise<string[]> {
    const placedIds = new Set(doc.planches.flatMap((page) => page.cadres.map((f) => f.image)))
    const placed = doc.images.filter((image) => placedIds.has(image.id))
    const loadable = await Promise.all(
        placed.map((image) => canLoadImage(localSourceOf(documentId, image.id) ?? image.url))
    )
    return placed
        .filter((_image, index) => !loadable[index])
        .map((image) => image.descriptif || image.url || 'Image sans lien')
}

/**
 * Déclare la taille de page du document, sans marge, puis ouvre l'impression du navigateur.
 * Une image qui ne se charge pas, ou une planche vide, est signalée avant l'ouverture : elle
 * sortirait comme un bloc d'erreur ou une page blanche.
 */
export async function printPdf(documentId: string, doc: AtelierDocument): Promise<void> {
    const broken = await findBrokenImages(documentId, doc)
    if (broken.length > 0) {
        toast.warning(`Images en échec, elles sortiront en bloc d’erreur : ${broken.join(', ')}.`)
    }
    const empty = doc.planches
        .map((page, index) => (page.cadres.length === 0 ? index + 1 : null))
        .filter((number) => number !== null)
    if (empty.length > 0) {
        toast.warning(`Planche sans image, elle sortira en page vide : ${empty.join(', ')}.`)
    }

    const { widthMm, heightMm } = getPageFormat(doc.format)
    let style = document.getElementById(STYLE_ID)
    if (!style) {
        style = document.createElement('style')
        style.id = STYLE_ID
        document.head.appendChild(style)
    }
    style.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`
    window.print()
}
