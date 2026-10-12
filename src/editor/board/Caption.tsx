import type { CaptionPlacement } from '@/core/document/schema'

interface CaptionProps {
    content: { descriptif: string; tags: string[] }
    placement: Exclude<CaptionPlacement, 'masquee'>
}

/** La légende d'un cadre : descriptif puis tags. Le texte qui dépasse est rogné, jamais le cadre. */
export function Caption({ content, placement }: CaptionProps) {
    return (
        <div className="board-caption" data-placement={placement}>
            {content.descriptif !== '' && <p className="board-caption-text">{content.descriptif}</p>}
            {content.tags.length > 0 && (
                <ul className="board-tags">
                    {content.tags.map((tag, index) => (
                        <li key={`${tag}:${index}`} className="board-tag">
                            {tag}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
