import { cn } from '~web/utils/helpers';

export const ColumnTypes = ({
  columns,
  hiddenColumns,
  onToggleColumn,
}: {
  columns: Array<{ name: string; type: string }>;
  hiddenColumns: Set<string>;
  onToggleColumn: (name: string) => void;
}) => (
  <div className="flex items-center gap-x-1 px-3 py-1 border-b border-[#1e1e1e] overflow-x-auto">
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
