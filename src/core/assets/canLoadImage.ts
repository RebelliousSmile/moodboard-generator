const LOAD_TIMEOUT_MS = 15_000

/** Vrai si le navigateur affiche cette adresse comme une image. Un délai dépassé compte pour un échec. */
export function canLoadImage(src: string): Promise<boolean> {
    if (!src) return Promise.resolve(false)
    return new Promise((resolve) => {
        const image = new Image()
        const timer = setTimeout(() => resolve(false), LOAD_TIMEOUT_MS)
        const settle = (loaded: boolean) => {
            clearTimeout(timer)
            resolve(loaded)
        }
        image.onload = () => settle(true)
        image.onerror = () => settle(false)
        image.src = src
    })
}
