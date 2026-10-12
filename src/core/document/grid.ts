import { calcGridItemPosition, type PositionParams } from 'react-grid-layout/core'
import { getPageFormat } from './formats'
import type { AtelierDocument, DocumentGrid } from './schema'

/** Un rectangle en cellules de grille. */
export interface Cells {
    x: number
    y: number
    w: number
    h: number
}

/** Un rectangle en pixels CSS, relatif à la planche. */
export interface PixelRect {
    left: number
    top: number
    width: number
    height: number
}

type GeometrySource = Pick<AtelierDocument, 'format' | 'grille' | 'apparence'>

/** Taille d'un cadre posé sans indication : bornée par la grille. */
export const DEFAULT_FRAME_SPAN = { w: 4, h: 4 } as const

/** Côté minimal d'une cellule : marge et gouttière cèdent avant que les cadres se recouvrent. */
const MIN_CELL_PX = 8

/**
 * Marge et gouttière réellement appliquées : celles du document, ramenées à ce que la page
 * peut porter. Au maximum des deux réglages, une grille dense garde des cellules positives
 * au lieu de se retourner et de faire sortir les cadres de la page.
 */
export function effectiveSpacing(source: GeometrySource): { marge: number; gouttiere: number } {
    const { widthPx, heightPx } = getPageFormat(source.format)
    const { colonnes, rangees } = source.grille
    const marge = Math.max(
        0,
        Math.min(
            source.apparence.marge,
            (widthPx - colonnes * MIN_CELL_PX) / 2,
            (heightPx - rangees * MIN_CELL_PX) / 2
        )
    )
    const room = (size: number, count: number) =>
        count > 1 ? (size - 2 * marge - count * MIN_CELL_PX) / (count - 1) : Infinity
    const gouttiere = Math.max(
        0,
        Math.min(source.apparence.gouttiere, room(widthPx, colonnes), room(heightPx, rangees))
    )
    return { marge, gouttiere }
}

/**
 * Paramètres de position de react-grid-layout. Édition et lecture seule passent par les
 * mêmes paramètres et la même fonction de calcul : un cadre y occupe les mêmes pixels.
 */
export function positionParams(source: GeometrySource): PositionParams {
    const { widthPx, heightPx } = getPageFormat(source.format)
    const { colonnes, rangees } = source.grille
    const { marge, gouttiere } = effectiveSpacing(source)
    const rowHeight = (heightPx - 2 * marge - gouttiere * (rangees - 1)) / rangees
    return {
        margin: [gouttiere, gouttiere],
        containerPadding: [marge, marge],
        containerWidth: widthPx,
        cols: colonnes,
        rowHeight,
        maxRows: rangees,
    }
}

export function cellsToRect(source: GeometrySource, cells: Cells): PixelRect {
    const { left, top, width, height } = calcGridItemPosition(
        positionParams(source),
        cells.x,
        cells.y,
        cells.w,
        cells.h
    )
    return { left, top, width, height }
}

/** Configuration de la grille d'édition, dérivée des mêmes valeurs que le rendu en lecture seule. */
export function editGridConfig(source: GeometrySource) {
    const params = positionParams(source)
    return {
        width: params.containerWidth,
        cols: params.cols,
        rowHeight: params.rowHeight,
        margin: [...params.margin] as [number, number],
        containerPadding: [...params.containerPadding] as [number, number],
        maxRows: params.maxRows,
    }
}

export function cellsOverlap(a: Cells, b: Cells): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

export function withinGrid(cells: Cells, grid: DocumentGrid): boolean {
    return (
        cells.x >= 0 &&
        cells.y >= 0 &&
        cells.w >= 1 &&
        cells.h >= 1 &&
        cells.x + cells.w <= grid.colonnes &&
        cells.y + cells.h <= grid.rangees
    )
}

/** Ramène un rectangle dans la grille : taille d'abord, puis position. */
export function clampToGrid(cells: Cells, grid: DocumentGrid): Cells {
    const w = Math.min(Math.max(1, Math.round(cells.w)), grid.colonnes)
    const h = Math.min(Math.max(1, Math.round(cells.h)), grid.rangees)
    const x = Math.min(Math.max(0, Math.round(cells.x)), grid.colonnes - w)
    const y = Math.min(Math.max(0, Math.round(cells.y)), grid.rangees - h)
    return { x, y, w, h }
}

export function isFree(cells: Cells, others: readonly Cells[], grid: DocumentGrid): boolean {
    return withinGrid(cells, grid) && others.every((other) => !cellsOverlap(cells, other))
}

/**
 * Où poser un cadre de la taille demandée : à l'emplacement visé s'il est libre, sinon au
 * premier emplacement libre en parcourant la planche de haut en bas. Null si la planche est pleine.
 */
export function findFreeSlot(
    span: Pick<Cells, 'w' | 'h'>,
    others: readonly Cells[],
    grid: DocumentGrid,
    target?: Pick<Cells, 'x' | 'y'>
): Cells | null {
    const w = Math.min(span.w, grid.colonnes)
    const h = Math.min(span.h, grid.rangees)
    if (target) {
        const wanted = clampToGrid({ ...target, w, h }, grid)
        if (isFree(wanted, others, grid)) return wanted
    }
    for (let y = 0; y + h <= grid.rangees; y += 1) {
        for (let x = 0; x + w <= grid.colonnes; x += 1) {
            const candidate = { x, y, w, h }
            if (isFree(candidate, others, grid)) return candidate
        }
    }
    return null
}

/** Les cadres qui sortiraient d'une grille de ces dimensions. */
export function overflowingCells<T extends Cells>(frames: readonly T[], grid: DocumentGrid): T[] {
    return frames.filter((frame) => !withinGrid(frame, grid))
}
