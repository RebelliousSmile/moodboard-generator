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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DocumentImage } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import { Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { FocusPicker } from './FocusPicker'
import { LocalFileField } from './LocalFileField'
import { TagsInput } from './TagsInput'

interface ImageFormProps {
    image: DocumentImage
    /** Vrai quand l'image figure sur une planche : la suppression retire aussi son cadre. */
    placed: boolean
}

export function ImageForm({ image, placed }: ImageFormProps) {
    const updateImage = useWorkspaceStore((state) => state.updateImage)
    const removeImage = useWorkspaceStore((state) => state.removeImage)
    const unplaceImage = useWorkspaceStore((state) => state.unplaceImage)
    const [confirming, setConfirming] = useState(false)

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="image-url">Lien</Label>
                <Input
                    id="image-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    spellCheck={false}
                    // Une image tout juste créée n'a pas de lien : le curseur l'attend là.
                    autoFocus={image.url === ''}
                    value={image.url}
                    onChange={(event) => updateImage(image.id, { url: event.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="image-description">Descriptif</Label>
                <Textarea
                    id="image-description"
                    className="min-h-20"
                    value={image.descriptif}
                    onChange={(event) => updateImage(image.id, { descriptif: event.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="image-tags">Tags</Label>
                <TagsInput
                    id="image-tags"
                    tags={image.tags}
                    onChange={(tags) => updateImage(image.id, { tags })}
                />
            </div>

            <FocusPicker image={image} />

            <LocalFileField image={image} />

            {placed && (
                <Button
                    variant="outline"
                    size="sm"
                    className="justify-self-start"
                    onClick={() => unplaceImage(image.id)}
                >
                    <Undo2 />
                    Retirer de la planche
                </Button>
            )}

            <Button
                variant="outline"
                size="sm"
                className="text-destructive justify-self-start"
                onClick={() => setConfirming(true)}
            >
                <Trash2 />
                Supprimer l'image
            </Button>

            <AlertDialog open={confirming} onOpenChange={setConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette image ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {placed
                                ? 'Elle est retirée du document et de la planche où elle est posée.'
                                : 'Elle est retirée du document.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => removeImage(image.id)}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
