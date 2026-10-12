import { useImageSource } from '@/core/assets/useImageSource'
import { captionContent } from '@/core/document/appearance'
import type { CaptionSettings, DocumentImage } from '@/core/document/schema'
import { cn } from '@/utils/cn'
import { ImageOff } from 'lucide-react'
import { useImageStatus } from '../reserve/useImageStatus'
import { Caption } from './Caption'

interface FrameContentProps {
    image: DocumentImage
    /** Réglage de légende du document : commun à tous les cadres. */
    caption: CaptionSettings
    className?: string
}

/**
 * Le contenu d'un cadre : l'image rognée à son format, centrée sur son point visible, et sa
 * légende à l'emplacement choisi pour le document.
 */
export function FrameContent({ image, caption, className }: FrameContentProps) {
    const { src } = useImageSource(image)
    const { status, onLoad, onError } = useImageStatus(src)
    const content = captionContent(image, caption)
    const placement = content ? caption.emplacement : 'masquee'

    return (
        <div
            data-status={status}
            data-caption={placement}
            className={cn('board-frame', className)}
        >
            <div className="board-frame-image">
                {src && status !== 'error' && (
                    <img
                        src={src}
                        alt={image.descriptif}
                        draggable={false}
                        onLoad={onLoad}
                        onError={onError}
                        className="size-full object-cover"
                        style={{ objectPosition: `${image.focus.x}% ${image.focus.y}%` }}
                    />
                )}
                {status === 'error' && (
                    <div
                        data-export-ignore="false"
                        className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs"
                    >
                        <ImageOff className="size-5" />
                        <span>Lien en échec</span>
                    </div>
                )}
            </div>
            {content && placement !== 'masquee' && (
                <Caption content={content} placement={placement} />
            )}
        </div>
    )
}
