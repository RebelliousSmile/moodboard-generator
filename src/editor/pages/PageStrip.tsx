import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { getPageFormat } from '@/core/document/formats'
import type { DocumentPage } from '@/core/document/schema'
import { selectActivePage } from '@/core/workspace/selectors'
import { useWorkspaceStore } from '@/core/workspace/store'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { cn } from '@/utils/cn'
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageView } from '../board/PageView'

interface PageStripProps {
    entry: WorkspaceDocument
}

const THUMBNAIL_WIDTH = 72

export function PageStrip({ entry }: PageStripProps) {
    const addPage = useWorkspaceStore((state) => state.addPage)
    const removePage = useWorkspaceStore((state) => state.removePage)
    const movePage = useWorkspaceStore((state) => state.movePage)
    const setActivePage = useWorkspaceStore((state) => state.setActivePage)
    const [pending, setPending] = useState<DocumentPage | null>(null)

    const { doc } = entry
    const active = selectActivePage(entry)
    const { widthPx, heightPx } = getPageFormat(doc.format)
    const scale = THUMBNAIL_WIDTH / widthPx

    return (
        <nav
            aria-label="Planches du document"
            className="bg-background flex shrink-0 items-end gap-3 overflow-x-auto border-t p-3"
        >
            {doc.planches.map((page, index) => {
                const isActive = page.id === active?.id
                const title = page.titre || `Planche ${index + 1}`
                return (
                    <div key={page.id} className="flex shrink-0 flex-col items-center gap-1">
                        <button
                            type="button"
                            aria-label={title}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => setActivePage(page.id)}
                            className={cn(
                                'relative overflow-hidden rounded-sm border bg-white shadow-sm',
                                isActive && 'ring-primary ring-2'
                            )}
                            style={{ width: THUMBNAIL_WIDTH, height: heightPx * scale }}
                        >
                            <div
                                className="pointer-events-none absolute top-0 left-0"
                                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                            >
                                <PageView doc={doc} page={page} />
                            </div>
                        </button>
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Avancer ${title}`}
                                disabled={index === 0}
                                onClick={() => movePage(page.id, index - 1)}
                            >
                                <ArrowLeft />
                            </Button>
                            <span className="text-muted-foreground w-12 truncate text-center text-xs">
                                {title}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Reculer ${title}`}
                                disabled={index === doc.planches.length - 1}
                                onClick={() => movePage(page.id, index + 1)}
                            >
                                <ArrowRight />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Supprimer ${title}`}
                                onClick={() => setPending(page)}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    </div>
                )
            })}

            <Button variant="outline" size="sm" className="self-center" onClick={() => addPage()}>
                <Plus />
                Planche
            </Button>

            <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette planche ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pending && pending.cadres.length > 0
                                ? `Ses ${pending.cadres.length} image(s) reviennent dans la réserve.`
                                : 'La planche est vide.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pending) removePage(pending.id)
                                setPending(null)
                            }}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </nav>
    )
}
