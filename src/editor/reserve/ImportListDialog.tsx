import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseImageList } from '@/core/document/listImport'
import { useWorkspaceStore } from '@/core/workspace/store'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

interface ImportListDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    existingUrls: string[]
}

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count > 1 ? pluralForm : singular}`
}

const PLACEHOLDER = `- url: https://exemple.org/image.jpg
  descriptif: Une plage au petit matin
  tags: [mer, lumière]`

export function ImportListDialog({ open, onOpenChange, existingUrls }: ImportListDialogProps) {
    const addImages = useWorkspaceStore((state) => state.addImages)
    const [text, setText] = useState('')

    const report = useMemo(
        () => (text.trim() ? parseImageList(text, existingUrls) : null),
        [text, existingUrls]
    )
    const addable = report?.ok ? report.images.length : 0

    const close = () => {
        setText('')
        onOpenChange(false)
    }

    const submit = () => {
        if (!report?.ok || addable === 0) return
        addImages(report.images)
        const skipped = [
            report.ignored.length > 0 &&
                plural(report.ignored.length, 'entrée ignorée', 'entrées ignorées'),
            report.duplicates.length > 0 &&
                plural(report.duplicates.length, 'doublon', 'doublons'),
        ].filter(Boolean)
        toast.success(plural(addable, 'image ajoutée', 'images ajoutées'), {
            description: skipped.length > 0 ? skipped.join(' · ') : undefined,
        })
        close()
    }

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Coller une liste</DialogTitle>
                    <DialogDescription>
                        Une liste d'images en YAML ou en JSON : un lien (url), et si besoin un
                        descriptif et des tags.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="import-list-text">Liste</Label>
                    <Textarea
                        id="import-list-text"
                        className="h-48 max-h-48 resize-none font-mono text-xs"
                        placeholder={PLACEHOLDER}
                        spellCheck={false}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                    />
                </div>

                <div aria-live="polite" className="min-h-10 text-sm">
                    {report === null && (
                        <p className="text-muted-foreground">
                            Le compte rendu s'affiche dès que la liste est collée.
                        </p>
                    )}
                    {report?.ok === false && (
                        <p role="alert" className="text-destructive">
                            {report.error.replace(/[.\s]+$/, '')}. Rien ne sera ajouté.
                        </p>
                    )}
                    {report?.ok && (
                        <div className="grid gap-2">
                            <p data-testid="import-report" className="font-medium">
                                {plural(addable, 'image à ajouter', 'images à ajouter')} ·{' '}
                                {plural(report.ignored.length, 'ignorée', 'ignorées')} ·{' '}
                                {plural(report.duplicates.length, 'doublon', 'doublons')}
                            </p>
                            {(report.ignored.length > 0 || report.duplicates.length > 0) && (
                                <ul className="text-muted-foreground max-h-28 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs">
                                    {report.ignored.map((entry) => (
                                        <li key={`i${entry.position}`} className="break-all">
                                            Entrée {entry.position} ignorée : {entry.reason}
                                        </li>
                                    ))}
                                    {report.duplicates.map((entry) => (
                                        <li key={`d${entry.position}`} className="break-all">
                                            Entrée {entry.position} en doublon : {entry.url}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        Annuler
                    </Button>
                    <Button disabled={addable === 0} onClick={submit}>
                        Ajouter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
