import { useCallback, useRef } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import type { DbSnapshot } from '../types';

const MIN_SIDEBAR_WIDTH = 100;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 160;

export { DEFAULT_SIDEBAR_WIDTH };

export const Sidebar = ({
  tables,
  selectedTable,
  onSelect,
  width,
  onWidthChange,
}: {
  tables: DbSnapshot['tables'];
  selectedTable: string | null;
  onSelect: (name: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
}) => {
  const resizingRef = useRef(false);
  const widthRef = useRef(width);
  widthRef.current = width;
  const onWidthChangeRef = useRef(onWidthChange);
  onWidthChangeRef.current = onWidthChange;

  const handleResizeStart = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = widthRef.current;
      resizingRef.current = true;

      const onMove = (ev: PointerEvent) => {
        const newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, startWidth + ev.clientX - startX),
        );
        onWidthChangeRef.current(newWidth);
      };

      const onUp = () => {
        resizingRef.current = false;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [],
  );

  return (
    <div
      className="relative overflow-y-auto flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      {tables.map((table) => (
        <button
          key={table.name}
          type="button"
          onClick={() => onSelect(table.name)}
          className={cn(
            'w-full text-left px-3 py-1.5',
            'text-xs truncate',
            'hover:bg-[#5f3f9a]/20',
            'transition-colors',
            selectedTable === table.name
              ? 'bg-[#5f3f9a]/30 text-neutral-200'
              : 'text-neutral-400',
          )}
        >
          <div className="flex items-center justify-between gap-x-1">
            <span className="truncate">{table.name}</span>
            <span className="text-[10px] text-neutral-600 flex-shrink-0">
              {table.rowCount}
            </span>
          </div>
        </button>
      ))}

      <div
        data-sidebar-resize
        onPointerDown={handleResizeStart}
        className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-10 group"
      >
        <div className="absolute right-0 top-0 w-[1px] h-full bg-[#27272A] group-hover:bg-purple-500 transition-colors" />
      </div>
    </div>
  );
};
