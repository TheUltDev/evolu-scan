import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import { formatCellValue } from '../utils/format-cell-value';

export type SortDir = 'asc' | 'desc';
export type SortConfig = { column: string; dir: SortDir } | null;

const ROW_NUMBER_COLUMN_WIDTH_PX = 32;
const REORDER_DRAG_THRESHOLD_PX = 6;

const SortIndicator = ({ dir, active }: { dir: SortDir; active: boolean }) => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    className={cn(
      'inline-block ml-1 transition-colors',
      active ? 'text-neutral-300' : 'text-neutral-700',
    )}
  >
    {dir === 'asc' ? (
      <path d="M4 1L7 6H1Z" fill="currentColor" />
    ) : (
      <path d="M4 7L1 2H7Z" fill="currentColor" />
    )}
  </svg>
);

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'bigint' && typeof b === 'bigint') return a < b ? -1 : 1;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1;

  return String(a).localeCompare(String(b));
}

const fixedWidthStyle = (width: number) => ({
  width,
  minWidth: width,
  maxWidth: width,
});

const applyColumnOrder = (columns: string[], order: string[]): string[] => {
  if (order.length === 0) return columns;
  const columnSet = new Set(columns);
  const ordered = order.filter((col) => columnSet.has(col));
  const remaining = columns.filter((col) => !order.includes(col));
  return [...ordered, ...remaining];
};

export const DataTable = ({
  bodyRef,
  columns,
  rows,
  selectedTable,
  isEmpty,
  showDeleted,
  hiddenColumns,
  sort,
  onSortChange,
  columnWidths,
  onColumnWidthsChange,
  columnOrder,
  onColumnOrderChange,
  columnTypes,
  onResetAll,
}: {
  bodyRef: { current: HTMLDivElement | null };
  columns: string[];
  rows: Array<Record<string, unknown>>;
  selectedTable: string | null;
  isEmpty: boolean;
  showDeleted: boolean;
  hiddenColumns: Set<string>;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  columnWidths: Record<string, number>;
  onColumnWidthsChange: (widths: Record<string, number>) => void;
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
  columnTypes: Record<string, string>;
  onResetAll: () => void;
}) => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>();
  const columnWidthsRef = useRef(columnWidths);
  columnWidthsRef.current = columnWidths;
  const onColumnWidthsChangeRef = useRef(onColumnWidthsChange);
  onColumnWidthsChangeRef.current = onColumnWidthsChange;
  const resizingRef = useRef(false);
  const draggingColumnRef = useRef(false);
  const headerRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const headerTextRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const columnOrderRef = useRef(columnOrder);
  columnOrderRef.current = columnOrder;
  const onColumnOrderChangeRef = useRef(onColumnOrderChange);
  onColumnOrderChangeRef.current = onColumnOrderChange;
  const [dragState, setDragState] = useState<{
    sourceCol: string;
    targetCol: string | null;
    dropSide: 'left' | 'right' | null;
  } | null>(null);

  const copyToClipboard = useCallback((cellKey: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      clearTimeout(copyTimeout.current);
      setCopiedCell(cellKey);
      copyTimeout.current = setTimeout(() => setCopiedCell(null), 1200);
    });
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const DRAG_THRESHOLD = 4;
    let pending = false;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let pointerId = -1;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-resize-handle], button')) return;
      if ((e.target as HTMLElement).closest('th')) return;
      e.stopPropagation();
      pending = true;
      dragging = false;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
      pointerId = e.pointerId;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pending && !dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (pending && !dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        dragging = true;
        pending = false;
        el.setPointerCapture(pointerId);
        el.style.cursor = 'grabbing';
      }

      el.scrollLeft = scrollLeft - dx;
      el.scrollTop = scrollTop - dy;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragging) {
        el.releasePointerCapture(e.pointerId);
        el.style.cursor = '';
      }
      pending = false;
      dragging = false;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const orderedColumns = useMemo(
    () => applyColumnOrder(columns, columnOrder),
    [columns, columnOrder],
  );

  const visibleColumns = useMemo(
    () => orderedColumns.filter((col) => !hiddenColumns.has(col)),
    [orderedColumns, hiddenColumns],
  );

  const handleResizeStart = useCallback((col: string, event: PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    resizingRef.current = true;

    const handle = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const headerEl = headerRefs.current.get(col);
    const textEl = headerTextRefs.current.get(col);
    const startWidth = columnWidthsRef.current[col] ?? headerEl?.offsetWidth ?? 100;
    const CELL_HORIZONTAL_PADDING_PX = 16;
    const RESIZE_HANDLE_WIDTH_PX = 7;
    const minWidth = textEl
      ? textEl.offsetWidth + CELL_HORIZONTAL_PADDING_PX + RESIZE_HANDLE_WIDTH_PX
      : 40;

    handle.setPointerCapture(event.pointerId);
    document.body.style.cursor = 'col-resize';

    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + delta);
      onColumnWidthsChangeRef.current({ ...columnWidthsRef.current, [col]: newWidth });
    };

    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('lostpointercapture', onUp);
      document.body.style.cursor = '';
      setTimeout(() => { resizingRef.current = false; }, 0);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('lostpointercapture', onUp);
  }, []);

  const handleReorderStart = useCallback((sourceCol: string, nativeEvent: PointerEvent) => {
    if ((nativeEvent.target as HTMLElement).closest('[data-resize-handle]')) return;

    nativeEvent.stopPropagation();

    const thEl = headerRefs.current.get(sourceCol);
    if (!thEl) return;

    const startX = nativeEvent.clientX;
    const startY = nativeEvent.clientY;
    let isDragging = false;

    const findDropTarget = (clientX: number): { targetCol: string; dropSide: 'left' | 'right' } | null => {
      for (const [colName, el] of headerRefs.current.entries()) {
        if (colName === sourceCol) continue;
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          const midpoint = rect.left + rect.width / 2;
          return { targetCol: colName, dropSide: clientX < midpoint ? 'left' : 'right' };
        }
      }
      return null;
    };

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!isDragging && Math.sqrt(dx * dx + dy * dy) < REORDER_DRAG_THRESHOLD_PX) return;

      if (!isDragging) {
        isDragging = true;
        draggingColumnRef.current = true;
        document.body.style.cursor = 'grabbing';
      }

      const target = findDropTarget(moveEvent.clientX);
      setDragState({
        sourceCol,
        targetCol: target?.targetCol ?? null,
        dropSide: target?.dropSide ?? null,
      });
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';

      if (isDragging) {
        setDragState((current) => {
          if (current?.targetCol && current.sourceCol !== current.targetCol) {
            const currentOrder = applyColumnOrder(columnsRef.current, columnOrderRef.current);
            const filtered = currentOrder.filter((c) => c !== current.sourceCol);
            const targetIdx = filtered.indexOf(current.targetCol);
            const insertIdx = current.dropSide === 'right' ? targetIdx + 1 : targetIdx;
            filtered.splice(insertIdx, 0, current.sourceCol);
            onColumnOrderChangeRef.current(filtered);
          }
          return null;
        });
        setTimeout(() => { draggingColumnRef.current = false; }, 0);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  const toggleSort = useCallback((col: string) => {
    if (resizingRef.current || draggingColumnRef.current) return;
    if (sort?.column !== col) onSortChange({ column: col, dir: 'asc' });
    else if (sort.dir === 'asc') onSortChange({ column: col, dir: 'desc' });
    else onSortChange(null);
  }, [sort, onSortChange]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { column, dir } = sort;
    return [...rows].sort((a, b) => {
      const cmp = compareValues(a[column], b[column]);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        bodyRef.current = el;
        scrollRef.current = el;
      }}
      className="flex-1 overflow-auto cursor-grab"
      style={{ touchAction: 'none' }}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-xs text-neutral-600">
          {selectedTable ? 'No rows' : 'Select a table'}
        </div>
      ) : (
        <table className="text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
            <tr>
              <th
                className="px-2 py-1.5 text-left text-[10px] text-neutral-500 font-medium border-b border-[#27272A] cursor-pointer select-none hover:text-neutral-300 transition-colors"
                style={fixedWidthStyle(ROW_NUMBER_COLUMN_WIDTH_PX)}
                onClick={() => onResetAll()}
              >
                #
              </th>
              {visibleColumns.map((col) => {
                const hasCustomWidth = col in columnWidths;
                const isDropTarget = dragState?.targetCol === col;
                const dropSide = dragState?.dropSide;
                const isBeingDragged = dragState?.sourceCol === col;
                return (
                  <th
                    key={col}
                    ref={(el: HTMLTableCellElement | null) => {
                      if (el) headerRefs.current.set(col, el);
                      else headerRefs.current.delete(col);
                    }}
                    className={cn(
                      'relative px-2 py-1.5 text-left text-[10px] text-neutral-500 font-medium border-b border-[#27272A] whitespace-nowrap cursor-pointer select-none hover:text-neutral-300 transition-colors overflow-hidden',
                      isBeingDragged && 'opacity-40',
                    )}
                    style={hasCustomWidth ? fixedWidthStyle(columnWidths[col]) : undefined}
                    onClick={() => toggleSort(col)}
                    onPointerDown={(event: PointerEvent) => handleReorderStart(col, event)}
                  >
                    <span
                      ref={(el: HTMLSpanElement | null) => {
                        if (el) headerTextRefs.current.set(col, el);
                        else headerTextRefs.current.delete(col);
                      }}
                      className="truncate"
                    >
                      {col}
                    </span>
                    {sort?.column === col && (
                      <SortIndicator dir={sort.dir} active />
                    )}
                    <div
                      data-resize-handle
                      className="absolute right-0 top-0 bottom-0 w-[7px] cursor-col-resize z-20 group/resize"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(event) => handleResizeStart(col, event as unknown as PointerEvent)}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="absolute right-0 top-2 bottom-2 w-px bg-neutral-500 opacity-10 group-hover/resize:opacity-100 transition-opacity" />
                    </div>
                    {isDropTarget && dropSide === 'left' && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-purple-500 z-30" />
                    )}
                    {isDropTarget && dropSide === 'right' && (
                      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-purple-500 z-30" />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => {
              const isDeleted = showDeleted && !!row.isDeleted;
              return (
                <tr
                  key={rowIdx}
                  data-row-id={row.id != null ? String(row.id) : undefined}
                  className={cn(
                    'border-b border-[#1a1a1a] hover:bg-[#5f3f9a]/10 transition-colors',
                    isDeleted && 'opacity-40',
                  )}
                >
                  <td
                    className="px-2 py-1 text-neutral-600 tabular-nums"
                    style={fixedWidthStyle(ROW_NUMBER_COLUMN_WIDTH_PX)}
                  >
                    {rowIdx}
                  </td>
                  {visibleColumns.map((col) => {
                    const rowId = row.id != null ? String(row.id) : String(rowIdx);
                    const cellKey = `${rowId}:${col}`;
                    const copyCellKey = `${selectedTable}:${rowIdx}:${col}`;
                    const value = row[col];
                    const formatted = formatCellValue(value);
                    const isNull = value === null || value === undefined;
                    const hasCustomWidth = col in columnWidths;
                    const isDateCol = columnTypes[col] === 'DATE';

                    return (
                      <td
                        key={col}
                        data-cell-key={cellKey}
                        className={cn(
                          'px-2 py-1 whitespace-nowrap cursor-pointer overflow-hidden text-ellipsis',
                          'transition-colors duration-300',
                          dragState?.sourceCol === col && 'opacity-40',
                          copiedCell === copyCellKey
                            ? 'bg-blue-500/20 text-blue-400'
                            : isNull
                              ? 'text-neutral-600 italic'
                              : typeof value === 'number' || typeof value === 'bigint'
                                ? 'text-[#79c0ff]'
                                : typeof value === 'boolean' ||
                                    formatted === 'true' ||
                                    formatted === 'false'
                                  ? 'text-[#ff7b72]'
                                  : 'text-neutral-300',
                        )}
                        style={{
                          ...(hasCustomWidth ? fixedWidthStyle(columnWidths[col]) : undefined),
                          ...(isDateCol ? { direction: 'rtl', textAlign: 'left' } : undefined),
                        }}
                        title={copiedCell === copyCellKey ? 'Copied' : formatted}
                        onClick={() => copyToClipboard(copyCellKey, formatted)}
                      >
                        {copiedCell === copyCellKey ? 'Copied' : formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
