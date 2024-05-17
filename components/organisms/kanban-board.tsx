'use client'

import * as React from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KanbanCard {
  id: string
  title: string
  subtitle?: string
  meta?: string
  tag?: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanMoveEvent {
  cardId: string
  fromColumn: string
  toColumn: string
  index: number
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
  onMove?: (event: KanbanMoveEvent) => void
  onAddCard?: (columnId: string) => void
  className?: string
}

export function KanbanBoard({ columns: initial, onMove, onAddCard, className }: KanbanBoardProps) {
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initial)
  React.useEffect(() => setColumns(initial), [initial])

  const dragData = React.useRef<{ cardId: string; fromColumn: string } | null>(null)
  const [overInfo, setOverInfo] = React.useState<{ col: string; index: number } | null>(null)

  const onDragStart = (e: React.DragEvent, cardId: string, fromColumn: string) => {
    dragData.current = { cardId, fromColumn }
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', cardId)
    } catch {
      /* noop */
    }
  }

  const onDragOver = (e: React.DragEvent, col: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverInfo({ col, index })
  }

  const onDropCol = (e: React.DragEvent, toColumn: string, dropIndex?: number) => {
    e.preventDefault()
    const data = dragData.current
    if (!data) return
    const { cardId, fromColumn } = data
    setColumns((cols) => {
      const next = cols.map((c) => ({ ...c, cards: [...c.cards] }))
      const fromCol = next.find((c) => c.id === fromColumn)
      const toCol = next.find((c) => c.id === toColumn)
      if (!fromCol || !toCol) return cols
      const idx = fromCol.cards.findIndex((c) => c.id === cardId)
      if (idx === -1) return cols
      const [card] = fromCol.cards.splice(idx, 1)
      if (!card) return cols
      const insertAt =
        dropIndex !== undefined ? dropIndex : overInfo?.col === toColumn ? overInfo.index : toCol.cards.length
      const clamped = Math.max(0, Math.min(insertAt, toCol.cards.length))
      toCol.cards.splice(clamped, 0, card)
      onMove?.({ cardId, fromColumn, toColumn, index: clamped })
      return next
    })
    dragData.current = null
    setOverInfo(null)
  }

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2', className)}>
      {columns.map((col) => (
        <div
          key={col.id}
          onDragOver={(e) => onDragOver(e, col.id, col.cards.length)}
          onDrop={(e) => onDropCol(e, col.id)}
          className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {col.cards.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onAddCard?.(col.id)}
              aria-label={`Tambah kartu di ${col.title}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            {col.cards.map((card, idx) => (
              <li
                key={card.id}
                draggable
                onDragStart={(e) => onDragStart(e, card.id, col.id)}
                onDragOver={(e) => onDragOver(e, col.id, idx)}
                onDrop={(e) => onDropCol(e, col.id, idx)}
                className={cn(
                  'cursor-grab rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md',
                  overInfo?.col === col.id && overInfo.index === idx && 'ring-2 ring-secondary',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{card.title}</p>
                  <button
                    type="button"
                    aria-label="Opsi kartu"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                {card.subtitle ? (
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                ) : null}
                {(card.tag || card.meta) && (
                  <div className="mt-2 flex items-center justify-between">
                    {card.tag ? (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary">
                        {card.tag}
                      </span>
                    ) : <span />}
                    {card.meta ? (
                      <span className="text-[10px] text-muted-foreground">{card.meta}</span>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default KanbanBoard
