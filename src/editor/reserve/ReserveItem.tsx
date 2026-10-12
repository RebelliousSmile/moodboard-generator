import { Badge } from '@/components/ui/badge'
import { useImageSource } from '@/core/assets/useImageSource'
import type { DocumentImage } from '@/core/document/schema'
import { cn } from '@/utils/cn'
import { ImageOff, Link2, LoaderCircle } from 'lucide-react'
import { IMAGE_DRAG_TYPE } from '../board/dnd'
import { useImageStatus } from './useImageStatus'

interface ReserveItemProps {
    image: DocumentImage
    selected: boolean
    onSelect: () => void
}

const MAX_VISIBLE_TAGS = 3

export function ReserveItem({ image, selected, onSelect }: ReserveItemProps) {
    const { src, replaced } = useImageSource(image)
    const { status, onLoad, onError } = useImageStatus(src)
    const label = image.descriptif || image.url || 'Image sans lien'
    const hiddenTags = image.tags.length - MAX_VISIBLE_TAGS

    return (
        <button
            type="button"
            aria-pressed={selected}
            aria-label={label}
            data-status={status}
            onClick={onSelect}
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData(IMAGE_DRAG_TYPE, image.id)
                event.dataTransfer.effectAllowed = 'copy'
            }}
            className={cn(
                'bg-background focus-visible:ring-ring flex w-full flex-col overflow-hidden rounded-md border text-left outline-none focus-visible:ring-2',
                selected && 'ring-primary ring-2'
            )}
        >
            <div className="bg-muted relative aspect-square w-full">
                {(status === 'loading' || status === 'loaded') && (
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        onLoad={onLoad}
                        onError={onError}
                        className={cn('size-full object-cover', status === 'loading' && 'opacity-0')}
                        style={{ objectPosition: `${image.focus.x}% ${image.focus.y}%` }}
                    />
                )}
                {replaced && (
                    <Badge variant="secondary" className="absolute top-1 left-1">
                        Fichier local
                    </Badge>
                )}
                {status !== 'loaded' && (
                    <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs">
                        {status === 'loading' && (
                            <LoaderCircle className="size-4 animate-spin" aria-label="Chargement" />
                        )}
                        {status === 'error' && (
                            <>
                                <ImageOff className="text-destructive size-4" />
                                <span>Lien en échec</span>
                            </>
                        )}
                        {status === 'empty' && (
                            <>
                                <Link2 className="size-4" />
                                <span>Lien à renseigner</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {(image.descriptif || image.tags.length > 0) && (
                <div className="flex flex-col gap-1 p-1.5">
                    {image.descriptif && <p className="line-clamp-2 text-xs">{image.descriptif}</p>}
                    {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {image.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                                <Badge key={tag} variant="secondary" className="max-w-full">
                                    <span className="truncate">{tag}</span>
                                </Badge>
                            ))}
                            {hiddenTags > 0 && <Badge variant="outline">+{hiddenTags}</Badge>}
                        </div>
                    )}
                </div>
            )}
        </button>
    )
}
