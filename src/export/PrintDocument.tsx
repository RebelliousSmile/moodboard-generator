import { getPageFormat } from '@/core/document/formats'
import type { AtelierDocument } from '@/core/document/schema'
import { PageView } from '@/editor/board/PageView'
import { createPortal } from 'react-dom'

interface PrintDocumentProps {
    doc: AtelierDocument
}

/**
 * Le document d'impression : une section par planche, rendue par la même `PageView` qu'à
 * l'écran. Masqué hors impression (voir `print.css`). La section a les dimensions exactes du
 * format en millimètres et rogne le débord des pixels arrondis, pour qu'aucune page blanche
 * ne suive la planche.
 */
export function PrintDocument({ doc }: PrintDocumentProps) {
    const { widthMm, heightMm } = getPageFormat(doc.format)

    return createPortal(
        <div data-print-root className="print-root">
            {doc.planches.map((page) => (
                <section
                    key={page.id}
                    className="print-page"
                    style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}
                >
                    <PageView doc={doc} page={page} />
                </section>
            ))}
        </div>,
        document.body
    )
}
