import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { attachLocalFile, detachLocalFile } from '@/core/assets/localSources'
import { useImageSource } from '@/core/assets/useImageSource'
import type { DocumentImage } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import { FileImage, X } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface LocalFileFieldProps {
    image: DocumentImage
}

/** Remplace le lien d'une image par un fichier du disque, gardé dans ce navigateur seulement. */
export function LocalFileField({ image }: LocalFileFieldProps) {
    const documentId = useWorkspaceStore((state) => state.activeId)
    const { replaced } = useImageSource(image)
    const inputRef = useRef<HTMLInputElement>(null)

    if (!documentId) return null

    const attach = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(`« ${file.name} » n’est pas une image.`)
            return
        }
        try {
            await attachLocalFile(documentId, image.id, file)
        } catch {
            toast.error('Le navigateur n’a pas pu conserver ce fichier.')
        }
    }

    const detach = async () => {
        try {
            await detachLocalFile(documentId, image.id)
        } catch {
            toast.error('Le fichier local n’a pas pu être retiré.')
        }
    }

    return (
        <div className="grid gap-2">
            <Label>Fichier local</Label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Choisir un fichier image"
                tabIndex={-1}
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file) void attach(file)
                }}
            />
            {replaced ? (
                <>
                    <p className="text-muted-foreground text-xs">
                        L’image est servie par un fichier de ce navigateur ; le lien reste dans le
                        document et dans le fichier YAML.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                            <FileImage />
                            Changer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void detach()}>
                            <X />
                            Retirer
                        </Button>
                    </div>
                </>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="justify-self-start"
                    onClick={() => inputRef.current?.click()}
                >
                    <FileImage />
                    Remplacer par un fichier…
                </Button>
            )}
        </div>
    )
}
