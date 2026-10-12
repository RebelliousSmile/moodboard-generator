const CHECK_TIMEOUT_MS = 10_000

const results = new Map<string, Promise<boolean>>()

async function readsCrossOrigin(url: string): Promise<boolean> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
    try {
        // `no-store` : une image déjà affichée sans mode inter-domaines est en cache sans les
        // en-têtes d'autorisation, et fausserait le résultat. Le lien lui-même reste intact.
        const response = await fetch(url, {
            mode: 'cors',
            cache: 'no-store',
            credentials: 'omit',
            signal: controller.signal,
        })
        controller.abort()
        return response.ok
    } catch {
        return false
    } finally {
        clearTimeout(timer)
    }
}

/**
 * Une capture lit les pixels de l'image par une requête inter-domaines : un site qui l'interdit
 * ne peut pas y figurer. Le résultat est mémorisé par lien pour la session.
 */
export function isCapturable(url: string): Promise<boolean> {
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) return Promise.resolve(true)
    let result = results.get(url)
    if (!result) {
        result = readsCrossOrigin(url)
        results.set(url, result)
    }
    return result
}
