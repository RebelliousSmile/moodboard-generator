import { getPageFormat } from '@/core/document/formats'
import type { AtelierDocument, DocumentPage } from '@/core/document/schema'
import { PageView } from '@/editor/board/PageView'
import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { downloadBlob } from './download'
import { pngFileName } from './fileNames'

export const PNG_SCALES = [1, 2, 3] as const
export type PngScale = (typeof PNG_SCALES)[number]

const IMAGE_SETTLE_TIMEOUT_MS = 15_000

export interface PngExportOutcome {
    /** Fichiers téléchargés. */
    files: number
    /** Images que la capture n'a pas pu lire : leur emplacement porte le bloc de substitution. */
    substituted: number
}

function whenSettled(image: HTMLImageElement): Promise<void> {
    if (image.complete) return Promise.resolve()
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, IMAGE_SETTLE_TIMEOUT_MS)
        const done = () => {
            clearTimeout(timer)
            resolve()
        }
        image.addEventListener('load', done, { once: true })
        image.addEventListener('error', done, { once: true })
    })
}

/**
 * Monte la planche en lecture seule, à ses dimensions réelles et hors de la vue, le temps de la
 * capturer. Ni la planche de l'éditeur (réduite par transformation) ni le document d'impression
 * (non rendu à l'écran) ne donnent les bons pixels.
 */
async function captureBlob(
    doc: AtelierDocument,
    page: DocumentPage,
    scale: PngScale
): Promise<{ blob: Blob; substituted: number }> {
    const { widthPx, heightPx } = getPageFormat(doc.format)
    const host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = `position:fixed;left:-100000px;top:0;width:${widthPx}px;height:${heightPx}px;pointer-events:none`
    document.body.appendChild(host)
    const root = createRoot(host)
    try {
        flushSync(() => root.render(createElement(PageView, { doc, page })))
        await Promise.all([...host.querySelectorAll('img')].map(whenSettled))
        await document.fonts.ready
        const target = host.firstElementChild
        if (!target) throw new Error('Planche absente de la capture')
        // `dpr: 1` : la taille du fichier est celle du format multipliée par l'échelle, quel que
        // soit l'écran qui l'exporte.
        // Chargé à la première capture : la bibliothèque pèse près de 300 kB.
        const { snapdom } = await import('@zumer/snapdom')
        const capture = await snapdom(target, { scale, dpr: 1, embedFonts: true })
        const blob = await capture.toBlob({ format: 'png' })
        const substituted = capture.warnings.filter(({ code }) => code === 'image-fallback').length
        return { blob, substituted }
    } finally {
        root.unmount()
        host.remove()
    }
}

/** Une planche en PNG, téléchargée sous un nom tiré du titre et de son rang. */
export async function exportPagePng(
    doc: AtelierDocument,
    page: DocumentPage,
    scale: PngScale
): Promise<number> {
    const { blob, substituted } = await captureBlob(doc, page, scale)
    downloadBlob(pngFileName(doc.titre, doc.planches.indexOf(page) + 1, scale), blob)
    return substituted
}

/** Les planches données, l'une après l'autre : un téléchargement par planche. */
export async function exportPagesPng(
    doc: AtelierDocument,
    pages: DocumentPage[],
    scale: PngScale
): Promise<PngExportOutcome> {
    let substituted = 0
    for (const page of pages) substituted += await exportPagePng(doc, page, scale)
    return { files: pages.length, substituted }
}
