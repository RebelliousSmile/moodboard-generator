import { DocumentMenu } from '@/app/DocumentMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { selectActiveDocument } from '@/core/workspace/selectors'
import { useWorkspaceStore } from '@/core/workspace/store'
import { ExportPanel } from '@/export/ExportPanel'
import { FileUp } from 'lucide-react'
import { useState } from 'react'

interface AppTopBarProps {
    onImport: () => void
}

interface TitleFieldProps {
    titre: string
    onCommit: (titre: string) => void
}

function TitleField({ titre, onCommit }: TitleFieldProps) {
    const [draft, setDraft] = useState(titre)

    const commit = () => {
        const next = draft.trim()
        if (next && next !== titre) onCommit(next)
        else setDraft(titre)
    }

    return (
        <Input
            aria-label="Titre du document"
            className="h-8 w-72 font-medium"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
                if (event.key === 'Escape') setDraft(titre)
            }}
        />
    )
}

export function AppTopBar({ onImport }: AppTopBarProps) {
    const active = useWorkspaceStore(selectActiveDocument)
    const renameDocument = useWorkspaceStore((state) => state.renameDocument)

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            {active ? (
                <TitleField
                    // Remonté quand le titre change ailleurs (menu, import), pour repartir du titre enregistré.
                    key={`${active.id}:${active.doc.titre}`}
                    titre={active.doc.titre}
                    onCommit={(titre) => renameDocument(active.id, titre)}
                />
            ) : (
                <span className="px-1 font-medium">Atelier</span>
            )}

            <DocumentMenu />

            <div className="flex-1" />

            <Button variant="ghost" size="sm" onClick={onImport}>
                <FileUp />
                Importer
            </Button>
            {active && <ExportPanel entry={active} />}
            <span className="text-muted-foreground pl-1 text-xs">v{__APP_VERSION__}</span>
        </header>
    )
}
