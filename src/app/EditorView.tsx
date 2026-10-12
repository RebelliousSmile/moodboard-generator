import type { WorkspaceDocument } from '@/core/workspace/types'
import { selectActivePage } from '@/core/workspace/selectors'
import { BoardCanvas } from '@/editor/board/BoardCanvas'
import { Inspector } from '@/editor/inspector/Inspector'
import { PageStrip } from '@/editor/pages/PageStrip'
import { ReservePanel } from '@/editor/reserve/ReservePanel'

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
                    <BoardCanvas entry={entry} page={page} />
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
