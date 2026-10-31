import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FONT_OPTIONS } from '@/core/document/appearance'
import {
    CAPTION_PLACEMENTS,
    FONT_IDS,
    GUTTER_LIMITS,
    MARGIN_LIMITS,
    RADIUS_LIMITS,
    TEXT_SIZE_LIMITS,
    type CaptionPlacement,
    type DocumentAppearance,
    type FontId,
} from '@/core/document/schema'
import { useWorkspaceStore } from '@/core/workspace/store'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

const PLACEMENT_LABELS: Record<CaptionPlacement, string> = {
    dessous: 'Sous l’image',
    surimpression: 'Sur l’image',
    masquee: 'Masquée',
}

interface AppearancePanelProps {
    appearance: DocumentAppearance
}

interface RangeFieldProps {
    id: string
    label: string
    value: number
    limits: { min: number; max: number }
    onChange: (value: number) => void
}

function RangeField({ id, label, value, limits, onChange }: RangeFieldProps) {
    return (
        <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
                <Label htmlFor={id}>{label}</Label>
                <span className="text-muted-foreground text-xs tabular-nums">{value} px</span>
            </div>
            <input
                id={id}
                type="range"
                min={limits.min}
                max={limits.max}
                step={1}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="accent-primary w-full"
            />
        </div>
    )
}

interface ColorFieldProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
}

function ColorField({ id, label, value, onChange }: ColorFieldProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <Label htmlFor={id}>{label}</Label>
            <input
                id={id}
                type="color"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="border-input h-8 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
        </div>
    )
}

/** L'apparence générale : un seul réglage pour toutes les planches, visible en direct. */
export function AppearancePanel({ appearance }: AppearancePanelProps) {
    const updateAppearance = useWorkspaceStore((state) => state.updateAppearance)
    const resetAppearance = useWorkspaceStore((state) => state.resetAppearance)
    const [confirming, setConfirming] = useState(false)
    const { legende } = appearance
    const captionHidden = legende.emplacement === 'masquee'

    return (
        <div className="grid gap-5">
            <section className="grid gap-3" aria-label="Légende">
                <h3 className="text-sm font-medium">Légende</h3>
                <div className="grid gap-2">
                    <Label htmlFor="caption-placement">Emplacement</Label>
                    <Select
                        value={legende.emplacement}
                        onValueChange={(value) =>
                            updateAppearance({
                                legende: { emplacement: value as CaptionPlacement },
                            })
                        }
                    >
                        <SelectTrigger id="caption-placement" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CAPTION_PLACEMENTS.map((placement) => (
                                <SelectItem key={placement} value={placement}>
                                    {PLACEMENT_LABELS[placement]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="caption-description">Descriptif</Label>
                    <Switch
                        id="caption-description"
                        checked={legende.descriptif}
                        disabled={captionHidden}
                        onCheckedChange={(checked) =>
                            updateAppearance({ legende: { descriptif: checked } })
                        }
                    />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="caption-tags">Tags</Label>
                    <Switch
                        id="caption-tags"
                        checked={legende.tags}
                        disabled={captionHidden}
                        onCheckedChange={(checked) =>
                            updateAppearance({ legende: { tags: checked } })
                        }
                    />
                </div>
            </section>

            <section className="grid gap-3" aria-label="Habillage">
                <h3 className="text-sm font-medium">Habillage</h3>
                <ColorField
                    id="appearance-background"
                    label="Fond"
                    value={appearance.fond}
                    onChange={(fond) => updateAppearance({ fond })}
                />
                <RangeField
                    id="appearance-margin"
                    label="Marge"
                    value={appearance.marge}
                    limits={MARGIN_LIMITS}
                    onChange={(marge) => updateAppearance({ marge })}
                />
                <RangeField
                    id="appearance-gutter"
                    label="Gouttière"
                    value={appearance.gouttiere}
                    limits={GUTTER_LIMITS}
                    onChange={(gouttiere) => updateAppearance({ gouttiere })}
                />
                <RangeField
                    id="appearance-radius"
                    label="Arrondi"
                    value={appearance.arrondi}
                    limits={RADIUS_LIMITS}
                    onChange={(arrondi) => updateAppearance({ arrondi })}
                />
            </section>

            <section className="grid gap-3" aria-label="Texte">
                <h3 className="text-sm font-medium">Texte</h3>
                <div className="grid gap-2">
                    <Label htmlFor="appearance-font">Police</Label>
                    <Select
                        value={appearance.police}
                        onValueChange={(value) => updateAppearance({ police: value as FontId })}
                    >
                        <SelectTrigger id="appearance-font" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FONT_IDS.map((id) => (
                                <SelectItem key={id} value={id}>
                                    {FONT_OPTIONS[id].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <RangeField
                    id="appearance-text-size"
                    label="Taille du texte"
                    value={appearance.taille_texte}
                    limits={TEXT_SIZE_LIMITS}
                    onChange={(taille_texte) => updateAppearance({ taille_texte })}
                />
                <ColorField
                    id="appearance-text-color"
                    label="Couleur du texte"
                    value={appearance.couleur_texte}
                    onChange={(couleur_texte) => updateAppearance({ couleur_texte })}
                />
                <ColorField
                    id="appearance-tags-color"
                    label="Couleur des tags"
                    value={appearance.couleur_tags}
                    onChange={(couleur_tags) => updateAppearance({ couleur_tags })}
                />
            </section>

            <Button
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() => setConfirming(true)}
            >
                <RotateCcw />
                Rétablir par défaut
            </Button>

            <AlertDialog open={confirming} onOpenChange={setConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rétablir l’apparence par défaut ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Légende, couleurs, marge, gouttière, arrondi et police reprennent leurs
                            valeurs initiales sur toutes les planches.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={resetAppearance}>Rétablir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
