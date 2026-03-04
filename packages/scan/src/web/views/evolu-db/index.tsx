import { signal } from '@preact/signals';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ReactScanInternals } from '~core/index';
import { signalWidgetViews } from '~web/state';
import { Icon } from '~web/components/icon';
import { parseDatabase } from './utils/parse-database';
import { useFlashChanges } from './utils/use-flash-changes';
import { useFollowChanges } from './utils/use-follow-changes';
import { formatCellValue } from './utils/format-cell-value';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';
import { SearchBar } from './components/search-bar';
import { ColumnTypes } from './components/column-types';
import { DataTable } from './components/data-table';
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [hideEvoluTables, setHideEvoluTables] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const { followActive, toggleFollow, onChangesDetected, syncSelectedTable } =
    useFollowChanges(tableBodyRef, setSelectedTable, setSearchQuery);
  syncSelectedTable(selectedTable);

  const detectChanges = useFlashChanges(tableBodyRef, onChangesDetected);

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
        const first = snap.tables.find((t) => !t.name.startsWith('evolu_')) ?? snap.tables[0];
        setSelectedTable(first.name);
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

  const visibleRows = useMemo(() => {
    if (!currentTableData) return [];
    if (showDeleted || !currentTableData.columns.includes('isDeleted')) {
      return currentTableData.rows;
    }
    return currentTableData.rows.filter((row) => !row.isDeleted);
  }, [currentTableData, showDeleted]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return visibleRows;
    const q = searchQuery.toLowerCase();
    return visibleRows.filter((row) =>
      Object.values(row).some((v) =>
        formatCellValue(v).toLowerCase().includes(q),
      ),
    );
  }, [visibleRows, searchQuery]);

  const currentTableInfo = useMemo(() => {
    if (!snapshot || !selectedTable) return null;
    return snapshot.tables.find((t) => t.name === selectedTable) || null;
  }, [snapshot, selectedTable]);

  const visibleTables = useMemo(() => {
    if (!snapshot) return [];
    if (!hideEvoluTables) return snapshot.tables;
    return snapshot.tables.filter((t) => !t.name.startsWith('evolu_'));
  }, [snapshot, hideEvoluTables]);

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
        followActive={followActive}
        showDeleted={showDeleted}
        hideEvoluTables={hideEvoluTables}
        dbLoading={signalDbLoading}
        onRefresh={loadDb}
        onExport={onExportClick}
        onFollowToggle={toggleFollow}
        onShowDeletedToggle={() => setShowDeleted((v) => !v)}
        onHideEvoluTablesToggle={() => setHideEvoluTables((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tables={visibleTables}
          selectedTable={selectedTable}
          onSelect={(name) => {
            setSelectedTable(name);
            setSearchQuery('');
            setHiddenColumns(new Set());
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SearchBar
            inputRef={searchInputRef}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            selectedTable={selectedTable}
            filteredCount={filteredRows.length}
            totalCount={visibleRows.length}
          />

          {currentTableInfo && (
            <ColumnTypes
              columns={currentTableInfo.columns}
              hiddenColumns={hiddenColumns}
              onToggleColumn={(name) =>
                setHiddenColumns((prev) => {
                  const next = new Set(prev);
                  if (next.has(name)) next.delete(name);
                  else next.add(name);
                  return next;
                })
              }
            />
          )}

          <DataTable
            bodyRef={tableBodyRef}
            columns={currentTableData?.columns || []}
            rows={filteredRows}
            selectedTable={selectedTable}
            isEmpty={!currentTableData || currentTableData.rows.length === 0}
            showDeleted={showDeleted}
            hiddenColumns={hiddenColumns}
          />
        </div>
      </div>
    </div>
  );
};
