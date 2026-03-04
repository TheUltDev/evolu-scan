import { useCallback, useRef, useState } from 'preact/hooks';
import type { ChangeInfo } from './use-flash-changes';

export const useFollowChanges = (
  tableBodyRef: { current: HTMLDivElement | null },
  setSelectedTable: (table: string) => void,
  setSearchQuery: (query: string) => void,
) => {
  const [followActive, setFollowActive] = useState(false);
  const followActiveRef = useRef(false);
  followActiveRef.current = followActive;

  const selectedTableRef = useRef<string | null>(null);
  const hiddenColumnsRef = useRef<Set<string>>(new Set());
  const hideEvoluTablesRef = useRef(true);

  const syncSelectedTable = (table: string | null) => {
    selectedTableRef.current = table;
  };

  const syncHiddenColumns = (cols: Set<string>) => {
    hiddenColumnsRef.current = cols;
  };

  const syncHideEvoluTables = (hide: boolean) => {
    hideEvoluTablesRef.current = hide;
  };

  const onChangesDetected = useCallback((changes: ChangeInfo[]) => {
    if (!followActiveRef.current || changes.length === 0) return;

    const change = changes.find((c) =>
      hideEvoluTablesRef.current ? !c.tableName.startsWith('evolu_') : true,
    );
    if (!change) return;
    const firstRow = Math.min(...change.rowIndices);
    const hidden = hiddenColumnsRef.current;
    const firstCol = Array.from(change.columns).find((c) => !hidden.has(c));

    if (selectedTableRef.current !== change.tableName) {
      setSelectedTable(change.tableName);
      setSearchQuery('');
    }

    if (!firstCol) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = tableBodyRef.current;
        if (!container) return;
        const exactKey = `${change.tableName}:${firstRow}:${firstCol}`;
        const cell = container.querySelector(`[data-cell-key="${exactKey}"]`);
        if (cell) {
          (cell as HTMLElement).scrollIntoView({
            block: 'center',
            inline: 'center',
            behavior: 'smooth',
          });
        }
      });
    });
  }, [tableBodyRef, setSelectedTable, setSearchQuery]);

  const toggleFollow = useCallback(() => {
    setFollowActive((v) => !v);
  }, []);

  return {
    followActive,
    toggleFollow,
    onChangesDetected,
    syncSelectedTable,
    syncHiddenColumns,
    syncHideEvoluTables,
  };
};
