import { afterEach, describe, expect, it, vi } from 'vitest'
import { canLoadImage } from './canLoadImage'

type Outcome = 'load' | 'error' | 'never'

function stubImage(outcome: Outcome) {
    class FakeImage {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
            if (outcome === 'load') queueMicrotask(() => this.onload?.())
            if (outcome === 'error') queueMicrotask(() => this.onerror?.())
        }
    }
    vi.stubGlobal('Image', FakeImage)
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

describe('canLoadImage', () => {
    it('refuse une adresse vide sans charger', async () => {
        expect(await canLoadImage('')).toBe(false)
    })

    it("renvoie vrai quand l'image se charge", async () => {
        stubImage('load')
        expect(await canLoadImage('https://example.com/a.jpg')).toBe(true)
    })

    it("renvoie faux quand l'image échoue", async () => {
        stubImage('error')
        expect(await canLoadImage('https://example.com/a.jpg')).toBe(false)
    })

    it('compte un délai dépassé pour un échec', async () => {
        vi.useFakeTimers()
        stubImage('never')
        const result = canLoadImage('https://example.com/a.jpg')
        await vi.advanceTimersByTimeAsync(15_000)
        expect(await result).toBe(false)
    })
})
