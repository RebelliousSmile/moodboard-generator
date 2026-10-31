import { load } from 'js-yaml'
import { normalizeTags, type ImageInput } from './images'

export interface IgnoredEntry {
    /** Rang de l'entrée dans la liste collée, à partir de 1. */
    position: number
    reason: string
}

export interface DuplicateEntry {
    position: number
    url: string
}

export type ListImportResult =
    | {
          ok: true
          images: Required<ImageInput>[]
          ignored: IgnoredEntry[]
          duplicates: DuplicateEntry[]
      }
    | { ok: false; error: string }

const SHAPE_ERROR =
    'Liste illisible : des liens (un par ligne), un tableau d’images, ou un objet avec une clé « images » est attendu.'

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isHttpUrl(text: string): boolean {
    try {
        const { protocol } = new URL(text)
        return protocol === 'http:' || protocol === 'https:'
    } catch {
        return false
    }
}

function firstText(entry: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = entry[key]
        if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return ''
}

function readTags(value: unknown): string[] {
    if (typeof value === 'string') return normalizeTags(value.split(','))
    if (!Array.isArray(value)) return []
    return normalizeTags(value.filter((tag) => typeof tag === 'string'))
}

/**
 * Analyse une liste collée : des liens nus, un par ligne, ou des images en YAML ou en JSON. Les
 * listes de l'ancien outil sont acceptées : `lieu` et `description` alimentent le descriptif.
 */
export function parseImageList(
    text: string,
    existingUrls: readonly string[] = []
): ListImportResult {
    if (!text.trim()) return { ok: false, error: 'La liste est vide.' }

    let value: unknown
    try {
        // YAML englobe JSON : un seul lecteur suffit pour les deux.
        value = load(text)
    } catch (error) {
        const reason = error instanceof Error ? error.message.split('\n')[0] : String(error)
        return { ok: false, error: `Liste illisible : ${reason}` }
    }

    // Des liens nus, un par ligne, se lisent en YAML comme une seule chaîne repliée : on reprend
    // les lignes du texte. Un texte sans aucun lien reste refusé.
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    const entries: unknown[] | null = Array.isArray(value)
        ? value
        : isRecord(value) && Array.isArray(value.images)
          ? value.images
          : typeof value === 'string' && lines.some(isHttpUrl)
            ? lines
            : null
    if (entries === null) return { ok: false, error: SHAPE_ERROR }

    const known = new Set(existingUrls)
    const images: Required<ImageInput>[] = []
    const ignored: IgnoredEntry[] = []
    const duplicates: DuplicateEntry[] = []

    entries.forEach((rawEntry, index) => {
        const position = index + 1
        // Un lien nu vaut une image sans descriptif ni tags.
        const entry = typeof rawEntry === 'string' ? { url: rawEntry } : rawEntry
        if (!isRecord(entry)) {
            ignored.push({ position, reason: 'entrée illisible' })
            return
        }
        const url = typeof entry.url === 'string' ? entry.url.trim() : ''
        if (!url) {
            ignored.push({ position, reason: 'pas de lien (url)' })
            return
        }
        if (!isHttpUrl(url)) {
            ignored.push({ position, reason: `lien mal formé : ${url}` })
            return
        }
        if (known.has(url)) {
            duplicates.push({ position, url })
            return
        }
        known.add(url)
        images.push({
            url,
            descriptif: firstText(entry, ['descriptif', 'description', 'lieu']),
            tags: readTags(entry.tags),
        })
    })

    return { ok: true, images, ignored, duplicates }
}
