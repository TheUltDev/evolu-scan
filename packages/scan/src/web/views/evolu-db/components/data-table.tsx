import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import { formatCellValue } from '../utils/format-cell-value';

type SortDir = 'asc' | 'desc';
type SortConfig = { column: string; dir: SortDir } | null;

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

export const DataTable = ({
  bodyRef,
  columns,
  rows,
  selectedTable,
  isEmpty,
  showDeleted,
  hiddenColumns,
}: {
  bodyRef: { current: HTMLDivElement | null };
  columns: string[];
  rows: Array<Record<string, unknown>>;
  selectedTable: string | null;
  isEmpty: boolean;
  showDeleted: boolean;
  hiddenColumns: Set<string>;
}) => {
  const [sort, setSort] = useState<SortConfig>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>();

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
      if ((e.target as HTMLElement).closest('button, th')) return;
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

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col)),
    [columns, hiddenColumns],
  );

  const toggleSort = (col: string) => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, dir: 'asc' };
      if (prev.dir === 'asc') return { column: col, dir: 'desc' };
      return null;
    });
  };

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
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] text-neutral-500 font-medium border-b border-[#27272A] w-8">
                #
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left text-[10px] text-neutral-500 font-medium border-b border-[#27272A] whitespace-nowrap cursor-pointer select-none hover:text-neutral-300 transition-colors"
                  onClick={() => toggleSort(col)}
                >
                  {col}
                  {sort?.column === col && (
                    <SortIndicator dir={sort.dir} active />
                  )}
                </th>
              ))}
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
                  <td className="px-2 py-1 text-neutral-600 tabular-nums">{rowIdx}</td>
                  {visibleColumns.map((col) => {
                    const rowId = row.id != null ? String(row.id) : String(rowIdx);
                    const cellKey = `${rowId}:${col}`;
                    const copyCellKey = `${selectedTable}:${rowIdx}:${col}`;
                    const value = row[col];
                    const formatted = formatCellValue(value);
                    const isNull = value === null || value === undefined;

                    return (
                      <td
                        key={col}
                        data-cell-key={cellKey}
                        className={cn(
                          'px-2 py-1 max-w-[200px] truncate cursor-pointer',
                          'transition-colors duration-300',
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
                        title={copiedCell === copyCellKey ? 'Copied!' : formatted}
                        onClick={() => copyToClipboard(copyCellKey, formatted)}
                      >
                        {copiedCell === copyCellKey ? 'Copied!' : formatted}
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
