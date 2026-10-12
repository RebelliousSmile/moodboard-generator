import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { selectReserveImages } from '@/core/workspace/selectors'
import { useWorkspaceStore } from '@/core/workspace/store'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { ClipboardPaste, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ImportListDialog } from './ImportListDialog'
import { ReserveItem } from './ReserveItem'

interface ReservePanelProps {
    entry: WorkspaceDocument
}

export function ReservePanel({ entry }: ReservePanelProps) {
    const addImage = useWorkspaceStore((state) => state.addImage)
    const selectImage = useWorkspaceStore((state) => state.selectImage)
    const [importOpen, setImportOpen] = useState(false)

    const images = useMemo(() => selectReserveImages(entry), [entry])
    const existingUrls = useMemo(() => entry.doc.images.map((image) => image.url), [entry])
    const { selectedImageId } = entry.view

    return (
        <aside aria-label="Réserve" className="bg-sidebar flex w-64 shrink-0 flex-col border-r">
            <div className="flex flex-col gap-2 p-3">
                <h2 className="text-sm font-medium">
                    Réserve
                    <span className="text-muted-foreground font-normal"> · {images.length}</span>
                </h2>
                <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => addImage()}>
                        <Plus />
                        Image
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setImportOpen(true)}
                    >
                        <ClipboardPaste />
                        Coller une liste
                    </Button>
                </div>
            </div>

            {images.length === 0 ? (
                <p className="text-muted-foreground px-3 text-sm">
                    {entry.doc.images.length === 0
                        ? 'Aucune image. Ajoutez-en une par son lien, ou collez une liste entière.'
                        : 'Toutes les images sont posées sur une planche.'}
                </p>
            ) : (
                <ScrollArea className="min-h-0 flex-1">
                    <ul className="grid grid-cols-2 gap-2 px-3 pb-3">
                        {images.map((image) => (
                            <li key={image.id} className="min-w-0">
                                <ReserveItem
                                    image={image}
                                    selected={image.id === selectedImageId}
                                    onSelect={() =>
                                        selectImage(image.id === selectedImageId ? null : image.id)
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            )}

            <ImportListDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                existingUrls={existingUrls}
            />
        </aside>
    )
}
