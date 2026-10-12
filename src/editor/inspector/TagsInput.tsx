import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { normalizeTags } from '@/core/document/images'
import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface TagsInputProps {
    id?: string
    tags: string[]
    onChange: (tags: string[]) => void
}

export function TagsInput({ id, tags, onChange }: TagsInputProps) {
    const [draft, setDraft] = useState('')

    const commit = () => {
        if (!draft.trim()) return
        onChange(normalizeTags([...tags, ...draft.split(',')]))
        setDraft('')
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            commit()
        } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
            onChange(tags.slice(0, -1))
        }
    }

    return (
        <div className="grid gap-2">
            {tags.length > 0 && (
                <ul className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                        <li key={tag} className="max-w-full">
                            <Badge variant="secondary" className="max-w-full gap-1 pr-1">
                                <span className="truncate">{tag}</span>
                                <button
                                    type="button"
                                    aria-label={`Retirer le tag ${tag}`}
                                    className="hover:bg-foreground/10 rounded-sm"
                                    onClick={() => onChange(tags.filter((other) => other !== tag))}
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        </li>
                    ))}
                </ul>
            )}
            <Input
                id={id}
                value={draft}
                placeholder="Ajouter un tag, puis Entrée"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commit}
            />
        </div>
    )
}
