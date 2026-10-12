import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { selectReserveImages, selectSelectedImage } from '@/core/workspace/selectors'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { useState } from 'react'
import { AppearancePanel } from './AppearancePanel'
import { ImageForm } from './ImageForm'
import { PageSettings } from './PageSettings'

interface InspectorProps {
    entry: WorkspaceDocument
}

type DocumentTab = 'page' | 'apparence'

const TABS: { id: DocumentTab; label: string }[] = [
    { id: 'page', label: 'Page' },
    { id: 'apparence', label: 'Apparence' },
]

export function Inspector({ entry }: InspectorProps) {
    const [tab, setTab] = useState<DocumentTab>('page')
    const image = selectSelectedImage(entry)
    const placed =
        image !== null && !selectReserveImages(entry).some((other) => other.id === image.id)

    return (
        <aside aria-label="Inspecteur" className="bg-sidebar flex w-72 shrink-0 flex-col border-l">
            {image ? (
                <h2 className="p-3 pb-2 text-sm font-medium">Image</h2>
            ) : (
                <div role="group" aria-label="Réglages du document" className="flex gap-1 p-3 pb-2">
                    {TABS.map(({ id, label }) => (
                        <Button
                            key={id}
                            size="sm"
                            variant={tab === id ? 'secondary' : 'ghost'}
                            aria-pressed={tab === id}
                            onClick={() => setTab(id)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            )}
            <ScrollArea className="min-h-0 flex-1">
                <div className="px-3 pb-3">
                    {image ? (
                        <ImageForm key={image.id} image={image} placed={placed} />
                    ) : tab === 'apparence' ? (
                        <AppearancePanel appearance={entry.doc.apparence} />
                    ) : (
                        <div className="grid gap-4">
                            <PageSettings doc={entry.doc} />
                            <p className="text-muted-foreground text-sm">
                                Sélectionnez une image ou un cadre pour modifier son lien, son
                                descriptif, ses tags et son point visible.
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
    )
}
