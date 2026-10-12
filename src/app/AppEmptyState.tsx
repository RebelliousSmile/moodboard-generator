import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/core/workspace/store'
import { FileUp, Plus } from 'lucide-react'

interface AppEmptyStateProps {
    onImport: () => void
}

export function AppEmptyState({ onImport }: AppEmptyStateProps) {
    const createDocument = useWorkspaceStore((state) => state.createDocument)

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-xl font-semibold">Aucun document</h1>
            <p className="text-muted-foreground max-w-md text-sm">
                Un document regroupe des images et les planches qui les mettent en page. Il
                est conservé dans ce navigateur et s'exporte en fichier YAML.
            </p>
            <div className="flex gap-2">
                <Button onClick={() => createDocument()}>
                    <Plus />
                    Créer un document
                </Button>
                <Button variant="outline" onClick={onImport}>
                    <FileUp />
                    Importer un fichier YAML
                </Button>
            </div>
        </main>
    )
}
