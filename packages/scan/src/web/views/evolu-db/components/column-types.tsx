import { useEffect, useRef } from 'preact/hooks';
import { cn } from '~web/utils/helpers';

export const ColumnTypes = ({
  columns,
  hiddenColumns,
  onToggleColumn,
}: {
  columns: Array<{ name: string; type: string }>;
  hiddenColumns: Set<string>;
  onToggleColumn: (name: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const DRAG_THRESHOLD = 4;
    let pending = false;
    let dragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let pointerId = -1;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) {
        e.stopPropagation();
        return;
      }
      pending = true;
      dragging = false;
      startX = e.clientX;
      scrollLeft = el.scrollLeft;
      pointerId = e.pointerId;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pending && !dragging) return;

      const dx = e.clientX - startX;

      if (pending && !dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        pending = false;
        el.setPointerCapture(pointerId);
        el.style.cursor = 'grabbing';
      }

      el.scrollLeft = scrollLeft - dx;
    };

    const suppressClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragging) {
        el.releasePointerCapture(e.pointerId);
        el.style.cursor = '';
        el.addEventListener('click', suppressClick, { capture: true, once: true });
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

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-x-1 px-3 py-1 border-b border-[#1e1e1e] overflow-x-auto cursor-grab"
      style={{ touchAction: 'pan-y' }}
    >
      {columns.map((col) => {
        const hidden = hiddenColumns.has(col.name);
        return (
          <button
            key={col.name}
            type="button"
            onClick={() => onToggleColumn(col.name)}
            className={cn(
              'flex items-center gap-x-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e] cursor-pointer select-none transition-opacity',
              hidden && 'opacity-30',
            )}
          >
            <span className="text-neutral-400">{col.name}</span>
            <span className="text-neutral-600">{col.type}</span>
          </button>
        );
      })}
    </div>
  );
};
