import { selectActivePage } from '@/core/workspace/selectors'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { Inspector } from '@/editor/inspector/Inspector'
import { PageStrip } from '@/editor/pages/PageStrip'
import { ReservePanel } from '@/editor/reserve/ReservePanel'
import { lazy, Suspense } from 'react'

// La grille (react-grid-layout, react-draggable) pèse lourd : elle arrive dans son propre fichier.
const BoardCanvas = lazy(() =>
    import('@/editor/board/BoardCanvas').then((module) => ({ default: module.BoardCanvas }))
)

interface EditorViewProps {
    entry: WorkspaceDocument
}

export function EditorView({ entry }: EditorViewProps) {
    const page = selectActivePage(entry)

    return (
        <div className="flex min-h-0 flex-1">
            <ReservePanel entry={entry} />

            <main aria-label="Planches" className="flex min-w-0 flex-1 flex-col">
                {page ? (
                    <Suspense fallback={<div className="bg-muted flex-1" />}>
                        <BoardCanvas entry={entry} page={page} />
                    </Suspense>
                ) : (
                    <p className="text-muted-foreground bg-muted flex flex-1 items-center justify-center text-sm">
                        Aucune planche : ajoutez-en une ci-dessous.
                    </p>
                )}
                <PageStrip entry={entry} />
            </main>

            <Inspector entry={entry} />
        </div>
    )
}
