/** Un texte réduit à des minuscules sans accents séparées par des tirets, ou le repli si rien n'en reste. */
export function slugify(text: string, fallback: string): string {
    const slug = text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return slug || fallback
}
