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

  const syncSelectedTable = (table: string | null) => {
    selectedTableRef.current = table;
  };

  const onChangesDetected = useCallback((changes: ChangeInfo[]) => {
    if (!followActiveRef.current || changes.length === 0) return;

    const change = changes.find((c) => !c.tableName.startsWith('evolu_'));
    if (!change) return;
    const firstRow = Math.min(...change.rowIndices);
    const firstCol = change.columns.values().next().value;

    if (selectedTableRef.current !== change.tableName) {
      setSelectedTable(change.tableName);
      setSearchQuery('');
    }

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
  };
};
