import { cn } from '~web/utils/helpers';
import type { DbSnapshot } from '../types';

export const Sidebar = ({
  tables,
  selectedTable,
  onSelect,
}: {
  tables: DbSnapshot['tables'];
  selectedTable: string | null;
  onSelect: (name: string) => void;
}) => (
  <div className="min-w-[140px] max-w-[180px] border-r border-[#27272A] overflow-y-auto">
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
  </div>
);
