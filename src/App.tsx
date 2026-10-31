import { AppEmptyState } from '@/app/AppEmptyState'
import { AppTopBar } from '@/app/AppTopBar'
import { EditorView } from '@/app/EditorView'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { parseDocumentYaml } from '@/core/document/yaml'
import { selectActiveDocument } from '@/core/workspace/selectors'
import { useWorkspaceStore } from '@/core/workspace/store'
import { PrintDocument } from '@/export/PrintDocument'
import { TriangleAlert } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

interface ImportFailure {
    fileName: string
    errors: string[]
}

export default function App() {
    const active = useWorkspaceStore(selectActiveDocument)
    const saveError = useWorkspaceStore((state) => state.saveError)
    const retrySave = useWorkspaceStore((state) => state.retrySave)
    const importDocument = useWorkspaceStore((state) => state.importDocument)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [importFailure, setImportFailure] = useState<ImportFailure | null>(null)

    const pickFile = () => fileInputRef.current?.click()

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        // Vidé pour pouvoir choisir deux fois de suite le même fichier.
        event.target.value = ''
        if (!file) return

        let text: string
        try {
            text = await file.text()
        } catch {
            setImportFailure({ fileName: file.name, errors: ['fichier illisible'] })
            return
        }
        const result = parseDocumentYaml(text)
        if (!result.ok) {
            setImportFailure({ fileName: file.name, errors: result.errors })
            return
        }
        importDocument(result.document)
        toast.success(`« ${result.document.titre} » importé`)
    }

    return (
        <TooltipProvider>
            <div className="flex h-dvh flex-col">
                <AppTopBar onImport={pickFile} />

                {saveError !== null && (
                    <div
                        role="alert"
                        className="border-destructive/40 bg-destructive/10 flex items-center gap-3 border-b px-4 py-2 text-sm"
                    >
                        <TriangleAlert className="text-destructive size-4 shrink-0" />
                        <p className="min-w-0 flex-1">
                            La sauvegarde locale ne fonctionne plus : vos modifications seront
                            perdues à la fermeture de l'onglet. Exportez le document en YAML pour le
                            conserver. <span className="text-muted-foreground">({saveError})</span>
                        </p>
                        <Button variant="outline" size="sm" onClick={retrySave}>
                            Réessayer
                        </Button>
                    </div>
                )}

                {active ? (
                    <EditorView key={active.id} entry={active} />
                ) : (
                    <AppEmptyState onImport={pickFile} />
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml,application/yaml,text/yaml"
                className="hidden"
                aria-label="Fichier YAML à importer"
                onChange={handleFile}
            />

            <Dialog
                open={importFailure !== null}
                onOpenChange={(open) => !open && setImportFailure(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fichier refusé</DialogTitle>
                        <DialogDescription>
                            « {importFailure?.fileName} » n'a pas été importé. Aucun document n'a
                            été créé.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                        {importFailure?.errors.map((error, index) => (
                            <li key={index} className="break-words">
                                {error}
                            </li>
                        ))}
                    </ul>
                    <DialogFooter>
                        <Button onClick={() => setImportFailure(null)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {active && <PrintDocument doc={active.doc} />}

            <Toaster position="bottom-right" />
        </TooltipProvider>
    )
}
