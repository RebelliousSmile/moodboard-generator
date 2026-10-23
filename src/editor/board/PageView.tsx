import { appearanceVars } from '@/core/document/appearance'
import { getPageFormat } from '@/core/document/formats'
import { cellsToRect } from '@/core/document/grid'
import type { AtelierDocument, DocumentPage } from '@/core/document/schema'
import { FrameContent } from './Frame'

interface PageViewProps {
    doc: AtelierDocument
    page: DocumentPage
}

/**
 * La planche en lecture seule : mêmes pixels que l'édition (`cellsToRect` passe par le calcul
 * de la bibliothèque de grille), sans poignée, repère ni sélection. C'est ce que l'impression
 * et les exports rendent.
 */
export function PageView({ doc, page }: PageViewProps) {
    const { widthPx, heightPx } = getPageFormat(doc.format)
    const imagesById = new Map(doc.images.map((image) => [image.id, image]))

    return (
        <div
            data-page={page.id}
            className="board-page relative overflow-hidden"
            style={{ width: widthPx, height: heightPx, ...appearanceVars(doc.apparence) }}
        >
            {page.cadres.map((frame) => {
                const image = imagesById.get(frame.image)
                if (!image) return null
                const rect = cellsToRect(doc, frame)
                return (
                    <div
                        key={frame.image}
                        data-frame={frame.image}
                        className="absolute"
                        style={{
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                        }}
                    >
                        <FrameContent image={image} caption={doc.apparence.legende} />
                    </div>
                )
            })}
        </div>
    )
}
