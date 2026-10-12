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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectActiveDocument } from '@/core/workspace/selectors'
import { useWorkspaceStore } from '@/core/workspace/store'
import { ChevronDown, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

type PendingAction = 'rename' | 'delete' | null

export function DocumentMenu() {
    const documents = useWorkspaceStore((state) => state.documents)
    const active = useWorkspaceStore(selectActiveDocument)
    const createDocument = useWorkspaceStore((state) => state.createDocument)
    const openDocument = useWorkspaceStore((state) => state.openDocument)
    const renameDocument = useWorkspaceStore((state) => state.renameDocument)
    const duplicateDocument = useWorkspaceStore((state) => state.duplicateDocument)
    const deleteDocument = useWorkspaceStore((state) => state.deleteDocument)

    const [pending, setPending] = useState<PendingAction>(null)
    const [renameDraft, setRenameDraft] = useState('')

    const startRename = () => {
        if (!active) return
        setRenameDraft(active.doc.titre)
        setPending('rename')
    }

    const submitRename = (event: FormEvent) => {
        event.preventDefault()
        if (!active || !renameDraft.trim()) return
        renameDocument(active.id, renameDraft)
        setPending(null)
    }

    const confirmDelete = () => {
        if (active) deleteDocument(active.id)
        setPending(null)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        Documents
                        <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem onSelect={() => createDocument()}>
                        <Plus />
                        Nouveau document
                    </DropdownMenuItem>

                    {documents.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Ouvrir</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={active?.id ?? ''}
                                onValueChange={openDocument}
                            >
                                {documents.map((entry) => (
                                    <DropdownMenuRadioItem key={entry.id} value={entry.id}>
                                        <span className="truncate">{entry.doc.titre}</span>
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={!active} onSelect={startRename}>
                        <Pencil />
                        Renommer…
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={!active}
                        onSelect={() => active && duplicateDocument(active.id)}
                    >
                        <Copy />
                        Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        disabled={!active}
                        onSelect={() => setPending('delete')}
                    >
                        <Trash2 />
                        Supprimer…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={pending === 'rename'}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <DialogContent>
                    <form onSubmit={submitRename} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Renommer le document</DialogTitle>
                            <DialogDescription>
                                Le titre sert aussi de nom au fichier exporté.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="document-rename">Titre</Label>
                            <Input
                                id="document-rename"
                                value={renameDraft}
                                onChange={(event) => setRenameDraft(event.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPending(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={!renameDraft.trim()}>
                                Renommer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={pending === 'delete'}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer « {active?.doc.titre} » ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Le document est retiré de ce navigateur. Sans fichier YAML exporté,
                            il ne pourra pas être récupéré.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
