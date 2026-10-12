import { useEffect, useState, type RefObject } from 'react'

const BREATHING_ROOM = 48

/**
 * Échelle d'affichage d'une planche dans sa zone : ajustée à l'espace disponible, ou
 * `zoom` quand il est fixé à la main. La planche garde ses dimensions en pixels, seul
 * l'affichage change d'échelle.
 */
export function usePageScale(
    viewportRef: RefObject<HTMLElement | null>,
    pageWidth: number,
    pageHeight: number,
    zoom: number | null
): number {
    const [fit, setFit] = useState(1)

    useEffect(() => {
        const element = viewportRef.current
        if (!element) return
        const measure = () => {
            const availableWidth = element.clientWidth - BREATHING_ROOM
            const availableHeight = element.clientHeight - BREATHING_ROOM
            if (availableWidth <= 0 || availableHeight <= 0) return
            setFit(Math.min(1, availableWidth / pageWidth, availableHeight / pageHeight))
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [viewportRef, pageWidth, pageHeight])

    return zoom ?? fit
}
