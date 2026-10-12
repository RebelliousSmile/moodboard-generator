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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { FORMAT_IDS, PAGE_FORMATS, type FormatId } from '@/core/document/formats'
import { overflowingFrames, type DocumentSettings } from '@/core/document/pages'
import type { AtelierDocument } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import { useState } from 'react'

interface PageSettingsProps {
    doc: AtelierDocument
}

const MAX_GRID = 48

function imageLabel(doc: AtelierDocument, imageId: string): string {
    const image = doc.images.find((candidate) => candidate.id === imageId)
    return image?.descriptif || image?.url || imageId
}

export function PageSettings({ doc }: PageSettingsProps) {
    const applySettings = useWorkspaceStore((state) => state.applySettings)
    const [pending, setPending] = useState<{ settings: DocumentSettings; names: string[] } | null>(
        null
    )
    // Incrémenté à l'annulation : remonte les champs, qui retrouvent la valeur enregistrée.
    const [cancelCount, setCancelCount] = useState(0)
    const cancel = () => {
        setPending(null)
        setCancelCount((count) => count + 1)
    }

    const change = (settings: DocumentSettings) => {
        const overflow = overflowingFrames(doc, { ...doc.grille, ...settings.grille })
        if (overflow.length > 0) {
            setPending({
                settings,
                names: overflow.map((entry) => imageLabel(doc, entry.imageId)),
            })
            return
        }
        applySettings(settings)
    }

    const gridField = (key: 'colonnes' | 'rangees', label: string) => (
        <div className="grid gap-2">
            <Label htmlFor={`grid-${key}`}>{label}</Label>
            <Input
                // Remonté avec la valeur enregistrée : une saisie refusée retrouve la valeur courante.
                key={`${key}:${doc.grille[key]}:${cancelCount}`}
                id={`grid-${key}`}
                type="number"
                min={1}
                max={MAX_GRID}
                defaultValue={doc.grille[key]}
                onBlur={(event) => {
                    const value = Math.round(Number(event.target.value))
                    if (!Number.isFinite(value) || value < 1 || value > MAX_GRID) {
                        event.target.value = String(doc.grille[key])
                        return
                    }
                    if (value !== doc.grille[key]) change({ grille: { [key]: value } })
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
            />
        </div>
    )

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="page-format">Format des planches</Label>
                <Select
                    value={doc.format}
                    onValueChange={(value) => change({ format: value as FormatId })}
                >
                    <SelectTrigger id="page-format" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FORMAT_IDS.map((id) => (
                            <SelectItem key={id} value={id}>
                                {PAGE_FORMATS[id].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {gridField('colonnes', 'Colonnes')}
                {gridField('rangees', 'Rangées')}
            </div>

            <AlertDialog open={pending !== null} onOpenChange={(open) => !open && cancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cette grille retire des cadres</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ces images sortiraient de la grille et reviennent dans la réserve :
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                        {pending?.names.map((name, index) => (
                            <li key={index} className="break-words">
                                {name}
                            </li>
                        ))}
                    </ul>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pending) applySettings(pending.settings, true)
                                setPending(null)
                            }}
                        >
                            Appliquer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
