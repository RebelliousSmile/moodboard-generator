import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { isCapturable } from '@/core/assets/capturability'
import {
    attachLocalFile,
    getSources,
    localSourceOf,
    subscribeToSources,
} from '@/core/assets/localSources'
import type { DocumentImage } from '@/core/document/schema'
import { serializeDocument, yamlFileName } from '@/core/document/yaml'
import { selectActivePage } from '@/core/workspace/selectors'
import type { WorkspaceDocument } from '@/core/workspace/types'
import { cn } from '@/utils/cn'
import { FileDown, FileImage, Image as ImageIcon, Printer, Share } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { downloadBlob } from './download'
import { exportPagesPng, PNG_SCALES, type PngScale } from './exportPng'
import { printPdf } from './printPdf'

/** Le temps de laisser le dialogue se retirer avant que l'impression ne le fige à l'écran. */
const DIALOG_CLOSE_DELAY_MS = 250

type PngScope = 'active' | 'all'

interface BlockedImage {
    image: DocumentImage
    /** Rang (à partir de 1) de la planche où l'image est posée. */
    pageNumber: number
}

function domainOf(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return url || 'lien absent'
    }
}

/** Les images posées dont le lien interdit la lecture des pixels, donc la capture en PNG. */
async function findBlockedImages(
    entry: WorkspaceDocument,
    isCancelled: () => boolean
): Promise<BlockedImage[] | null> {
    const { images, planches } = entry.doc
    const placed = planches.flatMap((page, index) =>
        page.cadres.flatMap((frame) => {
            const image = images.find((candidate) => candidate.id === frame.image)
            return image ? [{ image, pageNumber: index + 1 }] : []
        })
    )
    const verdicts = await Promise.all(
        placed.map(({ image }) =>
            localSourceOf(entry.id, image.id) ? true : isCapturable(image.url)
        )
    )
    if (isCancelled()) return null
    return placed.filter((_item, index) => !verdicts[index])
}

interface BlockedRowProps {
    item: BlockedImage
    onReplace: (image: DocumentImage, file: File) => void
}

function BlockedRow({ item, onReplace }: BlockedRowProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const { image, pageNumber } = item

    return (
        <li className="flex items-center gap-3">
            <img
                src={image.url}
                alt=""
                className="bg-muted size-10 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1 text-sm">
                <p className="truncate">{image.descriptif || 'Sans descriptif'}</p>
                <p className="text-muted-foreground truncate text-xs">
                    Planche {pageNumber} · {domainOf(image.url)}
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`Choisir un fichier pour ${image.descriptif || image.url}`}
                tabIndex={-1}
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file) onReplace(image, file)
                }}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <FileImage />
                Remplacer…
            </Button>
        </li>
    )
}

interface SegmentedProps<T extends string | number> {
    label: string
    options: { value: T; text: string }[]
    value: T
    onChange: (value: T) => void
}

function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
    return (
        <div role="group" aria-label={label} className="flex gap-1">
            {options.map((option) => (
                <Button
                    key={option.value}
                    variant={option.value === value ? 'default' : 'outline'}
                    size="sm"
                    aria-pressed={option.value === value}
                    onClick={() => onChange(option.value)}
                >
                    {option.text}
                </Button>
            ))}
        </div>
    )
}

interface ExportPanelProps {
    entry: WorkspaceDocument
}

export function ExportPanel({ entry }: ExportPanelProps) {
    const [open, setOpen] = useState(false)
    const [scope, setScope] = useState<PngScope>('active')
    const [scale, setScale] = useState<PngScale>(2)
    const [exporting, setExporting] = useState(false)
    const [blocked, setBlocked] = useState<BlockedImage[] | null>(null)
    // Le contrôle repart dès qu'un fichier local est posé ou retiré.
    const sources = useSyncExternalStore(subscribeToSources, getSources)

    const { doc } = entry
    const activePage = selectActivePage(entry)
    const replacedCount = doc.images.filter((image) => sources.has(`${entry.id}:${image.id}`)).length

    useEffect(() => {
        if (!open) return
        let cancelled = false
        void findBlockedImages(entry, () => cancelled).then((found) => {
            if (!cancelled) setBlocked(found)
        })
        return () => {
            cancelled = true
        }
        // `sources` : poser un fichier local sur une image bloquée doit relancer le contrôle.
    }, [open, entry, sources])

    const replace = async (image: DocumentImage, file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(`« ${file.name} » n’est pas une image.`)
            return
        }
        try {
            await attachLocalFile(entry.id, image.id, file)
        } catch {
            toast.error('Le navigateur n’a pas pu conserver ce fichier.')
        }
    }

    const print = async () => {
        setOpen(false)
        await new Promise((resolve) => setTimeout(resolve, DIALOG_CLOSE_DELAY_MS))
        await printPdf(entry.id, doc)
    }

    const exportPng = async () => {
        const pages = scope === 'active' ? (activePage ? [activePage] : []) : doc.planches
        if (pages.length === 0) return
        const empty = pages
            .filter((page) => page.cadres.length === 0)
            .map((page) => doc.planches.indexOf(page) + 1)
        if (empty.length > 0) {
            toast.warning(`Planche sans image, elle sortira vide : ${empty.join(', ')}.`)
        }
        setExporting(true)
        try {
            const { files, substituted } = await exportPagesPng(doc, pages, scale)
            const done = files === 1 ? '1 fichier PNG téléchargé' : `${files} fichiers PNG téléchargés`
            if (substituted > 0) {
                toast.warning(
                    `${done}, mais ${substituted} image(s) n’ont pas pu être lues : leur emplacement porte un bloc de substitution.`
                )
            } else {
                toast.success(`${done}.`)
            }
        } catch (error) {
            console.error('Export PNG impossible', error)
            toast.error('L’export PNG a échoué.')
        } finally {
            setExporting(false)
        }
    }

    const downloadYaml = () => {
        downloadBlob(
            yamlFileName(doc.titre),
            new Blob([serializeDocument(doc)], { type: 'application/yaml' })
        )
        if (replacedCount > 0) {
            toast.info(
                `Les fichiers locaux ne sont pas dans le YAML : ${replacedCount} image(s) retrouveront leur lien.`
            )
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next) setBlocked(null)
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Share />
                    Exporter
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Exporter</DialogTitle>
                    <DialogDescription>
                        PDF par l’impression du navigateur, PNG par planche, ou le fichier YAML du
                        document.
                    </DialogDescription>
                </DialogHeader>

                <section className="grid gap-2" aria-labelledby="export-pdf">
                    <h3 id="export-pdf" className="text-sm font-medium">
                        PDF
                    </h3>
                    <p className="text-muted-foreground text-xs">
                        Une page par planche. Choisissez « Enregistrer au format PDF » dans la
                        fenêtre d’impression.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-self-start"
                        onClick={() => void print()}
                    >
                        <Printer />
                        Imprimer…
                    </Button>
                </section>

                <section className="grid gap-3" aria-labelledby="export-png">
                    <h3 id="export-png" className="text-sm font-medium">
                        PNG
                    </h3>

                    {blocked === null ? (
                        <p className="text-muted-foreground text-xs">Contrôle des images…</p>
                    ) : blocked.length > 0 ? (
                        <div
                            role="alert"
                            className="border-destructive/40 grid gap-2 rounded-md border p-3"
                        >
                            <p className="text-sm">
                                {blocked.length === 1
                                    ? 'Une image interdit sa lecture par une capture :'
                                    : `${blocked.length} images interdisent leur lecture par une capture :`}{' '}
                                elle sortirait en bloc de substitution. Remplacez-la par un fichier
                                local.
                            </p>
                            <ul className="grid gap-2">
                                {blocked.map((item) => (
                                    <BlockedRow
                                        key={item.image.id}
                                        item={item}
                                        onReplace={(image, file) => void replace(image, file)}
                                    />
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-xs">
                            Toutes les images posées peuvent être capturées.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Segmented
                            label="Planches à exporter"
                            value={scope}
                            onChange={setScope}
                            options={[
                                { value: 'active', text: 'Planche active' },
                                { value: 'all', text: `Toutes (${doc.planches.length})` },
                            ]}
                        />
                        <Segmented
                            label="Échelle"
                            value={scale}
                            onChange={setScale}
                            options={PNG_SCALES.map((value) => ({ value, text: `×${value}` }))}
                        />
                    </div>

                    <Button
                        size="sm"
                        className={cn('justify-self-start')}
                        disabled={exporting || (scope === 'active' && !activePage)}
                        onClick={() => void exportPng()}
                    >
                        <ImageIcon />
                        {exporting ? 'Export en cours…' : 'Exporter en PNG'}
                    </Button>
                </section>

                <section className="grid gap-2" aria-labelledby="export-yaml">
                    <h3 id="export-yaml" className="text-sm font-medium">
                        YAML
                    </h3>
                    <p className="text-muted-foreground text-xs">
                        Le document se réimporte sans perte. Les fichiers locaux restent dans ce
                        navigateur : le fichier n’en contient que les liens.
                        {replacedCount > 0 &&
                            ` ${replacedCount} image(s) sont actuellement servies par un fichier local.`}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-self-start"
                        onClick={downloadYaml}
                    >
                        <FileDown />
                        Télécharger
                    </Button>
                </section>
            </DialogContent>
        </Dialog>
    )
}
