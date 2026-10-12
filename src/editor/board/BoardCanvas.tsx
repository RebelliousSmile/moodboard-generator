import { appearanceVars } from '@/core/document/appearance'
import { getPageFormat } from '@/core/document/formats'
import {
    DEFAULT_FRAME_SPAN,
    cellsToRect,
    editGridConfig,
    positionParams,
    type Cells,
} from '@/core/document/grid'
import type { DocumentPage } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { cn } from '@/utils/cn'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GridLayout } from 'react-grid-layout'
import { calcXY, noCompactor, transformStrategy } from 'react-grid-layout/core'
import { toast } from 'sonner'
import { IMAGE_DRAG_TYPE } from './dnd'
import { FrameContent } from './Frame'
import { GridOverlay } from './GridOverlay'
import { usePageScale } from './usePageScale'

interface BoardCanvasProps {
    entry: WorkspaceDocument
    page: DocumentPage
}

// Aucun tassement ni poussée : une collision se refuse, elle ne déplace pas les voisins.
const compactor = { ...noCompactor, preventCollision: true }

function isTypingTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    )
}

export function BoardCanvas({ entry, page }: BoardCanvasProps) {
    const { doc, view } = entry
    const placeImage = useWorkspaceStore((state) => state.placeImage)
    const setFrameCells = useWorkspaceStore((state) => state.setFrameCells)
    const unplaceImage = useWorkspaceStore((state) => state.unplaceImage)
    const selectImage = useWorkspaceStore((state) => state.selectImage)

    const { widthPx, heightPx } = getPageFormat(doc.format)
    const viewportRef = useRef<HTMLDivElement>(null)
    const scale = usePageScale(viewportRef, widthPx, heightPx, view.zoom)
    // Remonter la grille rend à un cadre refusé sa position enregistrée.
    const [revision, setRevision] = useState(0)

    const gridConfig = useMemo(() => {
        const { cols, rowHeight, margin, containerPadding, maxRows } = editGridConfig(doc)
        return { cols, rowHeight, margin, containerPadding, maxRows }
    }, [doc])
    const layout = useMemo(
        () =>
            page.cadres.map((frame) => ({
                i: frame.image,
                x: frame.x,
                y: frame.y,
                w: frame.w,
                h: frame.h,
                minW: 1,
                minH: 1,
            })),
        [page.cadres]
    )
    const imagesById = useMemo(
        () => new Map(doc.images.map((image) => [image.id, image])),
        [doc.images]
    )
    // L'échelle va au seul calcul de glisser de la bibliothèque : la stratégie « échelonnée »
    // la divise une seconde fois et décale le cadre (essai consigné dans architecture.md).
    const strategy = useMemo(() => ({ ...transformStrategy, scale }), [scale])
    const surfaceRef = useRef<HTMLDivElement>(null)

    // Le dépôt natif de la bibliothèque ignore l'échelle : la cellule visée se calcule ici.
    const dropTarget = (clientX: number, clientY: number) => {
        const surface = surfaceRef.current
        if (!surface) return undefined
        const box = surface.getBoundingClientRect()
        const span = cellsToRect(doc, { x: 0, y: 0, ...DEFAULT_FRAME_SPAN })
        const left = (clientX - box.left) / scale - span.width / 2
        const top = (clientY - box.top) / scale - span.height / 2
        return calcXY(
            positionParams(doc),
            Math.max(0, top),
            Math.max(0, left),
            DEFAULT_FRAME_SPAN.w,
            DEFAULT_FRAME_SPAN.h
        )
    }

    const commit = (imageId: string, cells: Cells) => {
        const result = setFrameCells(imageId, cells)
        if (!result.ok) {
            toast.error(`Déplacement refusé : ${result.reason}.`)
            setRevision((value) => value + 1)
        }
    }

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Delete' && event.key !== 'Backspace') return
            if (isTypingTarget(event.target)) return
            const imageId = view.selectedImageId
            if (!imageId || !page.cadres.some((frame) => frame.image === imageId)) return
            event.preventDefault()
            unplaceImage(imageId)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [view.selectedImageId, page.cadres, unplaceImage])

    return (
        <div
            ref={viewportRef}
            className="bg-muted flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto p-6"
            onClick={() => selectImage(null)}
        >
            <div
                data-board-viewport
                className="relative shrink-0 shadow-md"
                style={{ width: widthPx * scale, height: heightPx * scale }}
            >
                <div
                    data-board-surface
                    ref={surfaceRef}
                    onDragOver={(event) => {
                        if (!event.dataTransfer.types.includes(IMAGE_DRAG_TYPE)) return
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'copy'
                    }}
                    onDrop={(event) => {
                        const imageId = event.dataTransfer.getData(IMAGE_DRAG_TYPE)
                        if (!imageId) return
                        event.preventDefault()
                        const target = dropTarget(event.clientX, event.clientY)
                        const result = placeImage(imageId, target)
                        if (!result.ok) toast.error(`Pose refusée : ${result.reason}.`)
                    }}
                    className="board-grid board-page absolute top-0 left-0"
                    style={{
                        ...appearanceVars(doc.apparence),
                        width: widthPx,
                        height: heightPx,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                    onClick={(event) => {
                        event.stopPropagation()
                        selectImage(null)
                    }}
                >
                    <GridOverlay doc={doc} />
                    <GridLayout
                        key={`${page.id}:${revision}`}
                        width={widthPx}
                        gridConfig={gridConfig}
                        layout={layout}
                        compactor={compactor}
                        positionStrategy={strategy}
                        autoSize={false}
                        style={{ height: heightPx }}
                        onDragStop={(_layout, _old, item) => {
                            if (item) commit(item.i, { x: item.x, y: item.y, w: item.w, h: item.h })
                        }}
                        onResizeStop={(_layout, _old, item) => {
                            if (item) commit(item.i, { x: item.x, y: item.y, w: item.w, h: item.h })
                        }}
                    >
                        {page.cadres.map((frame) => {
                            const image = imagesById.get(frame.image)
                            const selected = view.selectedImageId === frame.image
                            return (
                                <div
                                    key={frame.image}
                                    data-frame={frame.image}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        selectImage(frame.image)
                                    }}
                                    className={cn(
                                        'cursor-grab outline-offset-0',
                                        selected && 'outline-primary outline-2'
                                    )}
                                >
                                    {image && (
                                        <FrameContent image={image} caption={doc.apparence.legende} />
                                    )}
                                </div>
                            )
                        })}
                    </GridLayout>
                </div>
            </div>
        </div>
    )
}
