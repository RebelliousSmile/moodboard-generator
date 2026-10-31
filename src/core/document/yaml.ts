import { slugify } from '@/utils/slug'
import { dump, load } from 'js-yaml'
import { parseDocument, type AtelierDocument, type DocumentParseResult } from './schema'

/** Une clé YAML laissée vide (`descriptif:`) vaut null : elle est lue comme un champ absent. */
function dropNulls(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(dropNulls)
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, entry]) => entry !== null)
                .map(([key, entry]) => [key, dropNulls(entry)])
        )
    }
    return value
}

/** Lit un fichier YAML et le valide ; chaque erreur nomme le champ fautif. */
export function parseDocumentYaml(text: string): DocumentParseResult {
    let value: unknown
    try {
        value = load(text)
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        return { ok: false, errors: [`YAML illisible : ${reason}`] }
    }
    return parseDocument(dropNulls(value))
}

/** Reconstruit le document clé par clé : l'ordre du fichier ne dépend pas de l'ordre en mémoire. */
function toOrderedValue(doc: AtelierDocument) {
    return {
        titre: doc.titre,
        format: doc.format,
        grille: {
            colonnes: doc.grille.colonnes,
            rangees: doc.grille.rangees,
        },
        apparence: {
            marge: doc.apparence.marge,
            gouttiere: doc.apparence.gouttiere,
            legende: {
                emplacement: doc.apparence.legende.emplacement,
                descriptif: doc.apparence.legende.descriptif,
                tags: doc.apparence.legende.tags,
            },
            fond: doc.apparence.fond,
            arrondi: doc.apparence.arrondi,
            couleur_texte: doc.apparence.couleur_texte,
            couleur_tags: doc.apparence.couleur_tags,
            police: doc.apparence.police,
            taille_texte: doc.apparence.taille_texte,
        },
        images: doc.images.map((image) => ({
            id: image.id,
            url: image.url,
            descriptif: image.descriptif,
            tags: [...image.tags],
            focus: { x: image.focus.x, y: image.focus.y },
        })),
        planches: doc.planches.map((page) => ({
            id: page.id,
            titre: page.titre,
            cadres: page.cadres.map((frame) => ({
                image: frame.image,
                x: frame.x,
                y: frame.y,
                w: frame.w,
                h: frame.h,
            })),
        })),
    }
}

export function serializeDocument(doc: AtelierDocument): string {
    return dump(toOrderedValue(doc), {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    })
}

/** Nom de fichier tiré du titre : minuscules, sans accents, tirets. */
export function yamlFileName(titre: string): string {
    return `${slugify(titre, 'document')}.yaml`
}
