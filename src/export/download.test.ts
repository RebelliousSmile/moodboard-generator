import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './download'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('downloadBlob', () => {
    it('clique un lien nommé sur une adresse temporaire, puis la libère', () => {
        const createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/x')
        const revokeObjectURL = vi.fn()
        Object.assign(URL, { createObjectURL, revokeObjectURL })
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

        const blob = new Blob(['a'])
        downloadBlob('planche.png', blob)

        expect(createObjectURL).toHaveBeenCalledWith(blob)
        expect(click).toHaveBeenCalledTimes(1)
        const link = click.mock.contexts[0] as HTMLAnchorElement
        expect(link.download).toBe('planche.png')
        expect(link.href).toBe('blob:http://localhost/x')
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/x')
        expect(document.querySelector('a[download]')).toBeNull()
    })
})
