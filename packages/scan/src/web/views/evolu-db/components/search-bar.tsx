import { Icon } from '../../../components/icon';
import { cn } from '../../../utils/helpers';

export const SearchBar = ({
  inputRef,
  query,
  onQueryChange,
  selectedTable,
  filteredCount,
  totalCount,
}: {
  inputRef: { current: HTMLInputElement | null };
  query: string;
  onQueryChange: (q: string) => void;
  selectedTable: string | null;
  filteredCount: number;
  totalCount: number;
}) => (
  <div className="p-2 border-b border-[#1e1e1e]">
    <div
      className={cn(
        'relative',
        'flex items-center gap-x-1 px-2',
        'rounded',
        'border border-transparent',
        'focus-within:border-[#454545]',
        'bg-[#1e1e1e] text-neutral-300',
        'transition-colors',
        'whitespace-nowrap',
        'overflow-hidden',
      )}
    >
      <Icon name="icon-search" size={12} className="text-neutral-500" />
      <div className="relative flex-1 h-7 overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.focus();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          onInput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
          className="absolute inset-y-0 inset-x-1"
          placeholder={`Search ${selectedTable || 'table'}...`}
        />
      </div>
      {query ? (
        <>
          <span className="text-xs text-neutral-500">
            {filteredCount}|{totalCount}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQueryChange('');
            }}
            className="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
          >
            <Icon name="icon-close" size={12} />
          </button>
        </>
      ) : (
        totalCount > 0 && (
          <span className="text-xs text-neutral-500">{totalCount} rows</span>
        )
      )}
    </div>
  </div>
);
