import { useState } from 'react'

export type ImageStatus = 'empty' | 'loading' | 'loaded' | 'error'

interface SettledImage {
    url: string
    status: 'loaded' | 'error'
}

/**
 * Suit le chargement d'un lien. Les gestionnaires se branchent sur une balise `img` sans
 * attribut `crossorigin` : le demander ferait échouer les sites qui ne l'autorisent pas.
 */
export function useImageStatus(url: string) {
    const [settled, setSettled] = useState<SettledImage | null>(null)

    // Un résultat ne vaut que pour le lien qui l'a produit : changer de lien repart en chargement.
    const status: ImageStatus = !url ? 'empty' : settled?.url === url ? settled.status : 'loading'

    return {
        status,
        onLoad: () => setSettled({ url, status: 'loaded' }),
        onError: () => setSettled({ url, status: 'error' }),
    }
}
