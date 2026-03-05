import { useCallback, useRef, useState } from 'preact/hooks';
import type { ChangeInfo } from './use-flash-changes';

export const useFollowChanges = (
  tableBodyRef: { current: HTMLDivElement | null },
  setSelectedTable: (table: string) => void,
  setSearchQuery: (query: string) => void,
  initialFollowActive = false,
) => {
  const [followActive, setFollowActive] = useState(initialFollowActive);
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

    if (selectedTableRef.current !== change.tableName) {
      setSelectedTable(change.tableName);
      setSearchQuery('');
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = tableBodyRef.current;
        if (!container) return;

        if (change.isNewRows) {
          const firstRowId = change.rowIds.values().next().value;
          if (firstRowId) {
            const row = container.querySelector(`[data-row-id="${firstRowId}"]`);
            if (row) {
              (row as HTMLElement).scrollIntoView({
                block: 'center',
                inline: 'center',
                behavior: 'smooth',
              });
              return;
            }
          }
        }

        const hidden = hiddenColumnsRef.current;
        const firstCol = Array.from(change.columns).find((c) => !hidden.has(c));
        if (!firstCol) return;

        const firstRowId = change.rowIds.values().next().value;
        if (firstRowId) {
          const cell = container.querySelector(`[data-cell-key="${firstRowId}:${firstCol}"]`);
          if (cell) {
            (cell as HTMLElement).scrollIntoView({
              block: 'center',
              inline: 'center',
              behavior: 'smooth',
            });
          }
        }
      });
    });
  }, [tableBodyRef, setSelectedTable, setSearchQuery]);

  const toggleFollow = useCallback(() => {
    setFollowActive((v) => !v);
  }, []);

  const disableFollow = useCallback(() => {
    setFollowActive(false);
  }, []);

  return {
    followActive,
    toggleFollow,
    disableFollow,
    onChangesDetected,
    syncSelectedTable,
    syncHiddenColumns,
    syncHideEvoluTables,
  };
};
