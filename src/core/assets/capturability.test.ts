import { afterEach, describe, expect, it, vi } from 'vitest'
import { isCapturable } from './capturability'

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('isCapturable', () => {
    it('accepte sans requête les liens data:, blob: et vide', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        expect(await isCapturable('data:image/png;base64,AAAA')).toBe(true)
        expect(await isCapturable('blob:http://localhost/abc')).toBe(true)
        expect(await isCapturable('')).toBe(true)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('lit les en-têtes en mode cors, sans cache ni identifiants', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true })
        vi.stubGlobal('fetch', fetchMock)
        expect(await isCapturable('https://cors-ok.example/a.jpg')).toBe(true)
        expect(fetchMock).toHaveBeenCalledWith(
            'https://cors-ok.example/a.jpg',
            expect.objectContaining({ mode: 'cors', cache: 'no-store', credentials: 'omit' })
        )
    })

    it('refuse un lien dont la réponse échoue ou que le navigateur bloque', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
        expect(await isCapturable('https://http-error.example/a.jpg')).toBe(false)
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
        expect(await isCapturable('https://blocked.example/a.jpg')).toBe(false)
    })

    it('mémorise le résultat par lien', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true })
        vi.stubGlobal('fetch', fetchMock)
        await isCapturable('https://memo.example/a.jpg')
        await isCapturable('https://memo.example/a.jpg')
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
