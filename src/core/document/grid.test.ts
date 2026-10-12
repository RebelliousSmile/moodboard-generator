import { describe, expect, it } from 'vitest'
import {
    cellsOverlap,
    cellsToRect,
    clampToGrid,
    findFreeSlot,
    isFree,
    overflowingCells,
    withinGrid,
} from './grid'
import { createEmptyDocument } from './model'

const grid = { colonnes: 12, rangees: 16 }

describe('géométrie de grille', () => {
    it('détecte le chevauchement de cellules, bords contigus exclus', () => {
        const a = { x: 0, y: 0, w: 4, h: 4 }
        expect(cellsOverlap(a, { x: 3, y: 3, w: 2, h: 2 })).toBe(true)
        expect(cellsOverlap(a, { x: 4, y: 0, w: 2, h: 2 })).toBe(false)
        expect(cellsOverlap(a, { x: 0, y: 4, w: 2, h: 2 })).toBe(false)
    })

    it('refuse un rectangle hors grille ou sans surface', () => {
        expect(withinGrid({ x: 8, y: 0, w: 4, h: 1 }, grid)).toBe(true)
        expect(withinGrid({ x: 9, y: 0, w: 4, h: 1 }, grid)).toBe(false)
        expect(withinGrid({ x: 0, y: 15, w: 1, h: 2 }, grid)).toBe(false)
        expect(withinGrid({ x: -1, y: 0, w: 1, h: 1 }, grid)).toBe(false)
        expect(withinGrid({ x: 0, y: 0, w: 0, h: 1 }, grid)).toBe(false)
    })

    it('ramène un rectangle dans la grille', () => {
        expect(clampToGrid({ x: 20, y: -3, w: 4, h: 40 }, grid)).toEqual({
            x: 8,
            y: 0,
            w: 4,
            h: 16,
        })
    })

    it('pose à l’emplacement visé s’il est libre, sinon au premier libre', () => {
        const others = [{ x: 0, y: 0, w: 4, h: 4 }]
        expect(findFreeSlot({ w: 4, h: 4 }, others, grid, { x: 6, y: 2 })).toEqual({
            x: 6,
            y: 2,
            w: 4,
            h: 4,
        })
        expect(findFreeSlot({ w: 4, h: 4 }, others, grid, { x: 1, y: 1 })).toEqual({
            x: 4,
            y: 0,
            w: 4,
            h: 4,
        })
    })

    it('rend null quand la planche est pleine', () => {
        const full = { colonnes: 2, rangees: 2 }
        const others = [{ x: 0, y: 0, w: 2, h: 2 }]
        expect(findFreeSlot({ w: 1, h: 1 }, others, full)).toBeNull()
        expect(isFree({ x: 0, y: 0, w: 1, h: 1 }, others, full)).toBe(false)
    })

    it('liste les cadres qui déborderaient d’une grille réduite', () => {
        const frames = [
            { image: 'a', x: 0, y: 0, w: 4, h: 4 },
            { image: 'b', x: 8, y: 0, w: 4, h: 4 },
        ]
        expect(overflowingCells(frames, { colonnes: 8, rangees: 16 }).map((f) => f.image)).toEqual([
            'b',
        ])
    })

    it('donne à un cadre les pixels de la bibliothèque de grille', () => {
        const doc = createEmptyDocument()
        const full = cellsToRect(doc, { x: 0, y: 0, w: 12, h: 16 })
        // A4 portrait 794 × 1123, marge 32 : le cadre plein occupe l'aire hors marges.
        expect(full.left).toBe(32)
        expect(full.top).toBe(32)
        expect(full.width).toBe(794 - 64)
        expect(full.height).toBe(1123 - 64)
    })

    it('garde la gouttière entre deux cadres voisins', () => {
        const doc = createEmptyDocument()
        const left = cellsToRect(doc, { x: 0, y: 0, w: 6, h: 4 })
        const right = cellsToRect(doc, { x: 6, y: 0, w: 6, h: 4 })
        expect(right.left - (left.left + left.width)).toBe(doc.apparence.gouttiere)
    })
})
