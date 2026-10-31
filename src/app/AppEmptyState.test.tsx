import { useWorkspaceStore } from '@/core/workspace/store'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppEmptyState } from './AppEmptyState'

let root: Root
let host: HTMLElement

function buttonNamed(name: string): HTMLButtonElement {
    const found = [...document.body.querySelectorAll('button')].find((button) =>
        button.textContent?.includes(name)
    )
    if (!found) throw new Error(`Bouton introuvable : ${name}`)
    return found
}

function typeInto(textarea: HTMLTextAreaElement, text: string) {
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    setValue.call(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    useWorkspaceStore.setState({ documents: [], activeId: null })
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
})

afterEach(() => {
    act(() => root.unmount())
    host.remove()
})

describe('AppEmptyState', () => {
    it("crée un document avec les liens d'une liste collée depuis l'écran de départ", async () => {
        act(() => root.render(<AppEmptyState onImport={() => {}} />))

        act(() => buttonNamed('Importer une liste de liens').click())
        const textarea = document.body.querySelector('textarea')
        expect(textarea).not.toBeNull()
        act(() => typeInto(textarea!, 'https://example.com/a.jpg\nhttps://example.com/b.jpg'))
        expect(document.body.querySelector('[data-testid="import-report"]')?.textContent).toContain(
            '2 images à ajouter'
        )

        act(() => buttonNamed('Ajouter').click())

        const { documents, activeId } = useWorkspaceStore.getState()
        expect(documents).toHaveLength(1)
        expect(activeId).toBe(documents[0].id)
        expect(documents[0].doc.images.map((image) => image.url)).toEqual([
            'https://example.com/a.jpg',
            'https://example.com/b.jpg',
        ])
    })
})
