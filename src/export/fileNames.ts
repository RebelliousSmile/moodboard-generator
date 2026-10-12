import { slugify } from '@/utils/slug'

/** `titre-planche-01@2x.png` : le titre nettoyé pour le système de fichiers, le rang de la planche, l'échelle. */
export function pngFileName(titre: string, pageNumber: number, scale: number): string {
    const number = String(pageNumber).padStart(2, '0')
    return `${slugify(titre, 'moodboard')}-planche-${number}@${scale}x.png`
}
