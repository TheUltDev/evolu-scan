import { signal } from '@preact/signals';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ReactScanInternals } from '~core/index';
import { signalWidgetViews } from '~web/state';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import { parseDatabase } from './utils/parse-database';
import { useFlashChanges } from './utils/use-flash-changes';
import { formatCellValue } from './utils/format-cell-value';
import { POLL_INTERVAL } from './consts';
import type { DbSnapshot } from './types';

const signalDbLoading = signal(false);

export const EvoluDbViewer = () => {
  const [snapshot, setSnapshot] = useState<DbSnapshot | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tableBodyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exportHandleRef = useRef<FileSystemFileHandle | null>(null);
  const [exportState, setExportState] = useState<'idle' | 'picking' | 'active'>('idle');

  const detectChanges = useFlashChanges(tableBodyRef);

  const loadDb = useCallback(async () => {
    const evolu = ReactScanInternals.options.value.evolu;
    if (!evolu) {
      setError('No Evolu instance configured');
      return;
    }

    signalDbLoading.value = true;
    try {
      const bytes = await evolu.exportDatabase();
      const raw = new Uint8Array(bytes);
      const snap = await parseDatabase(raw);
      setSnapshot((prev) => {
        if (prev && snap.tableData.size > 0) {
          detectChanges(prev, snap);
        }
        return snap;
      });
      setError(null);
      if (!selectedTable && snap.tables.length > 0) {
        setSelectedTable(snap.tables[0].name);
      }

      if (exportHandleRef.current) {
        try {
          const writable = await exportHandleRef.current.createWritable();
          await writable.write(raw);
          await writable.close();
        } catch {
          exportHandleRef.current = null;
          setExportState('idle');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database');
    } finally {
      signalDbLoading.value = false;
    }
  }, [selectedTable, detectChanges]);

  const onExportClick = useCallback(async () => {
    if (exportHandleRef.current) {
      exportHandleRef.current = null;
      setExportState('idle');
      return;
    }

    setExportState('picking');
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'evolu.db',
        types: [{
          description: 'Evolu SQLite Database',
          accept: { 'application/x-sqlite3': ['.sqlite3', '.sqlite', '.db'] },
        }],
      });
      exportHandleRef.current = handle;
      setExportState('active');
      loadDb();
    } catch {
      setExportState('idle');
    }
  }, [loadDb]);

  useEffect(() => {
    if (signalWidgetViews.value.view !== 'evolu') return;
    loadDb();
    pollingRef.current = setInterval(loadDb, POLL_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadDb, signalWidgetViews.value.view]);

  const currentTableData = useMemo(() => {
    if (!snapshot || !selectedTable) return null;
    return snapshot.tableData.get(selectedTable) || null;
  }, [snapshot, selectedTable]);

  const filteredRows = useMemo(() => {
    if (!currentTableData) return [];
    if (!searchQuery.trim()) return currentTableData.rows;
    const q = searchQuery.toLowerCase();
    return currentTableData.rows.filter((row) =>
      Object.values(row).some((v) =>
        formatCellValue(v).toLowerCase().includes(q),
      ),
    );
  }, [currentTableData, searchQuery]);

  const currentTableInfo = useMemo(() => {
    if (!snapshot || !selectedTable) return null;
    return snapshot.tables.find((t) => t.name === selectedTable) || null;
  }, [snapshot, selectedTable]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center px-4">
          <Icon name="icon-triangle-alert" size={24} className="text-red-400 mx-auto mb-2" />
          <div className="text-sm text-neutral-400">{error}</div>
          <button
            type="button"
            onClick={loadDb}
            className="mt-2 px-3 py-1 text-xs rounded bg-[#27272A] text-neutral-300 hover:bg-[#333]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading database...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Header
        snapshot={snapshot}
        exportState={exportState}
        onRefresh={loadDb}
        onExport={onExportClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tables={snapshot.tables}
          selectedTable={selectedTable}
          onSelect={(name) => {
            setSelectedTable(name);
            setSearchQuery('');
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SearchBar
            inputRef={searchInputRef}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            selectedTable={selectedTable}
            filteredCount={filteredRows.length}
            totalCount={currentTableData?.rows.length || 0}
          />

          {currentTableInfo && <ColumnTypes columns={currentTableInfo.columns} />}

          <DataTable
            bodyRef={tableBodyRef}
            columns={currentTableData?.columns || []}
            rows={filteredRows}
            selectedTable={selectedTable}
            isEmpty={!currentTableData || currentTableData.rows.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const Header = ({
  snapshot,
  exportState,
  onRefresh,
  onExport,
}: {
  snapshot: DbSnapshot;
  exportState: string;
  onRefresh: () => void;
  onExport: () => void;
}) => (
  <div className={cn('w-full flex border-b border-[#27272A] min-h-[40px]')}>
    <div className="min-w-fit w-full flex items-center pl-3 pr-2 text-sm gap-x-3">
      <Icon name="icon-database" size={14} className="text-[#8e61e3]" />
      <span className="text-neutral-300 text-xs font-medium">Evolu Database</span>
      <span className="text-[10px] text-neutral-500">
        {snapshot.tables.length} table{snapshot.tables.length !== 1 && 's'}
      </span>
      {signalDbLoading.value && (
        <span className="text-[10px] text-[#8e61e3] animate-pulse">syncing</span>
      )}
      <div className="flex items-center gap-x-2 ml-auto">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh"
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
        >
          <Icon name="icon-refresh-cw" size={14} />
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exportState === 'picking'}
          title={exportState === 'active' ? 'Stop exporting to file' : 'Export database to file'}
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
          style={{
            color:
              exportState === 'active'
                ? '#4ade80'
                : exportState === 'picking'
                  ? '#8e61e3'
                  : undefined,
          }}
        >
          <Icon name="icon-download" size={14} />
        </button>
      </div>
    </div>
  </div>
);

const Sidebar = ({
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

const SearchBar = ({
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

const ColumnTypes = ({ columns }: { columns: Array<{ name: string; type: string }> }) => (
  <div className="flex items-center gap-x-1 px-3 py-1 border-b border-[#1e1e1e] overflow-x-auto">
    {columns.map((col) => (
      <span
        key={col.name}
        className="flex items-center gap-x-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e]"
      >
        <span className="text-neutral-400">{col.name}</span>
        <span className="text-neutral-600">{col.type}</span>
      </span>
    ))}
  </div>
);

const DataTable = ({
  bodyRef,
  columns,
  rows,
  selectedTable,
  isEmpty,
}: {
  bodyRef: { current: HTMLDivElement | null };
  columns: string[];
  rows: Array<Record<string, unknown>>;
  selectedTable: string | null;
  isEmpty: boolean;
}) => (
  <div ref={bodyRef} className="flex-1 overflow-auto">
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
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1.5 text-left text-[10px] text-neutral-500 font-medium border-b border-[#27272A] whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-[#1a1a1a] hover:bg-[#5f3f9a]/10 transition-colors"
            >
              <td className="px-2 py-1 text-neutral-600 tabular-nums">{rowIdx}</td>
              {columns.map((col) => {
                const cellKey = `${selectedTable}:${rowIdx}:${col}`;
                const value = row[col];
                const formatted = formatCellValue(value);
                const isNull = value === null || value === undefined;

                return (
                  <td
                    key={col}
                    data-cell-key={cellKey}
                    className={cn(
                      'px-2 py-1 max-w-[200px] truncate',
                      'transition-colors duration-300',
                      isNull
                        ? 'text-neutral-600 italic'
                        : typeof value === 'number' || typeof value === 'bigint'
                          ? 'text-[#79c0ff]'
                          : typeof value === 'boolean' ||
                              formatted === 'true' ||
                              formatted === 'false'
                            ? 'text-[#ff7b72]'
                            : 'text-neutral-300',
                    )}
                    title={formatted}
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
