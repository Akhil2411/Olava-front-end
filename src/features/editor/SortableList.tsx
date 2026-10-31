"use client";

import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ItemControls {
  index: number;
  count: number;
  /** Drag handle (pointer, touch and keyboard: Space to pick up, arrows to move, Space to drop). */
  handle: ReactNode;
  /** Move up/down (or left/right) buttons for people who prefer not to drag. */
  arrows: ReactNode;
  dragging: boolean;
}

/**
 * Reorderable list: drag handles plus explicit move buttons, so it works with touch, mouse and keyboard.
 * `onReorder` receives the new id order (the caller saves it).
 */
export function SortableList<T>({ items, getId, getLabel, onReorder, renderItem, disabled, grid = false, className, itemClassName }: {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onReorder: (ids: string[]) => void;
  renderItem: (item: T, controls: ItemControls) => ReactNode;
  disabled?: boolean;
  /** Grid layout (gallery): arrows read left/right. */
  grid?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const labelOf = (id: string | number) => {
    const item = items.find((i) => getId(i) === id);
    return item ? getLabel(item) : "item";
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length || from === to) return;
    onReorder(arrayMove(ids, from, to));
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.`,
          onDragOver: ({ active, over }) => (over ? `${labelOf(active.id)} is over position ${ids.indexOf(String(over.id)) + 1} of ${ids.length}.` : `${labelOf(active.id)} is no longer over a position.`),
          onDragEnd: ({ active, over }) => (over ? `${labelOf(active.id)} dropped at position ${ids.indexOf(String(over.id)) + 1} of ${ids.length}.` : `${labelOf(active.id)} dropped.`),
          onDragCancel: ({ active }) => `Moving ${labelOf(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy} disabled={disabled}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)} label={getLabel(item)} index={index} count={items.length}
              disabled={disabled} grid={grid} className={itemClassName} onMove={move}>
              {(controls) => renderItem(item, controls)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, label, index, count, disabled, grid, className, onMove, children }: {
  id: string; label: string; index: number; count: number; disabled?: boolean; grid: boolean; className?: string;
  onMove: (from: number, to: number) => void; children: (controls: ItemControls) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const arrowBtn = "grid h-9 w-9 place-items-center rounded-full text-lg text-ink hover:bg-tint disabled:opacity-30";
  const handle = (
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={disabled}
      aria-label={`Drag to reorder ${label}`} aria-roledescription="sortable"
      className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-full text-mute hover:bg-tint active:cursor-grabbing disabled:opacity-30">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
        <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" /><circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" /><circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
      </svg>
    </button>
  );
  const arrows = (
    <span className="inline-flex">
      <button type="button" className={arrowBtn} disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)}
        aria-label={`Move ${label} ${grid ? "left" : "up"}`}>{grid ? "←" : "↑"}</button>
      <button type="button" className={arrowBtn} disabled={disabled || index === count - 1} onClick={() => onMove(index, index + 1)}
        aria-label={`Move ${label} ${grid ? "right" : "down"}`}>{grid ? "→" : "↓"}</button>
    </span>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && "relative z-10 opacity-90 shadow-lg")}>
      {children({ index, count, handle, arrows, dragging: isDragging })}
    </li>
  );
}
