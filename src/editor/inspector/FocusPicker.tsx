import type { DocumentImage } from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'

interface FocusPickerProps {
    image: DocumentImage
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

/** Le point visible : un clic sur l'image choisit ce qui reste au centre quand le cadre rogne. */
export function FocusPicker({ image }: FocusPickerProps) {
    const updateImage = useWorkspaceStore((state) => state.updateImage)
    if (!image.url) return null

    return (
        <div className="grid gap-2">
            <span className="text-sm leading-none font-medium">Point visible</span>
            <button
                type="button"
                aria-label="Choisir le point visible de l’image"
                className="bg-muted relative block w-full cursor-crosshair overflow-hidden rounded-md border"
                onClick={(event) => {
                    const box = event.currentTarget.getBoundingClientRect()
                    updateImage(image.id, {
                        focus: {
                            x: clampPercent(((event.clientX - box.left) / box.width) * 100),
                            y: clampPercent(((event.clientY - box.top) / box.height) * 100),
                        },
                    })
                }}
            >
                <img src={image.url} alt="" draggable={false} className="block w-full" />
                <span
                    aria-hidden
                    className="border-background bg-primary pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
                    style={{ left: `${image.focus.x}%`, top: `${image.focus.y}%` }}
                />
            </button>
            <p className="text-muted-foreground text-xs">
                {image.focus.x} % · {image.focus.y} %
            </p>
        </div>
    )
}
