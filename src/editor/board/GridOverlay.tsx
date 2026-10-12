import { cellsToRect } from '@/core/document/grid'
import type { AtelierDocument } from '@/core/document/schema'
import { useMemo } from 'react'

interface GridOverlayProps {
    doc: AtelierDocument
}

/** Repère des cellules : uniquement en édition, jamais dans la vue en lecture seule. */
export function GridOverlay({ doc }: GridOverlayProps) {
    const { format, grille, apparence } = doc
    const cells = useMemo(() => {
        const source = { format, grille, apparence }
        const result: { key: string; left: number; top: number; width: number; height: number }[] =
            []
        for (let y = 0; y < grille.rangees; y += 1) {
            for (let x = 0; x < grille.colonnes; x += 1) {
                result.push({ key: `${x}:${y}`, ...cellsToRect(source, { x, y, w: 1, h: 1 }) })
            }
        }
        return result
    }, [format, grille, apparence])

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            {cells.map((cell) => (
                <div
                    key={cell.key}
                    className="absolute border border-dashed border-sky-400/40"
                    style={{
                        left: cell.left,
                        top: cell.top,
                        width: cell.width,
                        height: cell.height,
                    }}
                />
            ))}
        </div>
    )
}
