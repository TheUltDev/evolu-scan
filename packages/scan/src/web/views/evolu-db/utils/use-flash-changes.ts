import { useCallback, useRef } from 'preact/hooks';
import { formatCellValue } from './format-cell-value';
import { FLASH_DURATION } from '../consts';
import type { DbSnapshot } from '../types';

export interface ChangeInfo {
  tableName: string;
  rowIndices: Set<number>;
  rowIds: Set<string>;
  columns: Set<string>;
  isNewRows: boolean;
}

function getRowId(row: Record<string, unknown>): string | null {
  const id = row.id;
  if (id === null || id === undefined) return null;
  return String(id);
}

export const useFlashChanges = (
  tableBodyRef: { current: HTMLDivElement | null },
  onChangesDetected?: (changes: ChangeInfo[]) => void,
) => {
  const prevValuesRef = useRef<Map<string, Map<string, string>>>(new Map());
  const prevRowIdsRef = useRef<Map<string, Set<string>>>(new Map());
  const flashingCellsRef = useRef<Set<string>>(new Set());

  const applyFlash = useCallback((cellKeys: Set<string>, rowIds: Set<string>) => {
    const container = tableBodyRef.current;
    if (!container) return;

    if (rowIds.size > 0) {
      for (const row of Array.from(container.querySelectorAll('[data-row-id]'))) {
        const id = row.getAttribute('data-row-id');
        if (id && rowIds.has(id)) {
          row.classList.remove('evolu-row-flash');
          void (row as HTMLElement).offsetWidth;
          row.classList.add('evolu-row-flash');
        }
      }
    }

    for (const cell of Array.from(container.querySelectorAll('[data-cell-key]'))) {
      const key = cell.getAttribute('data-cell-key');
      if (key && cellKeys.has(key)) {
        cell.classList.remove('evolu-cell-flash');
        void (cell as HTMLElement).offsetWidth;
        cell.classList.add('evolu-cell-flash');
      }
    }
  }, [tableBodyRef]);

  const removeFlash = useCallback((cellKeys: Set<string>, rowIds: Set<string>) => {
    const container = tableBodyRef.current;
    if (!container) return;

    if (rowIds.size > 0) {
      for (const row of Array.from(container.querySelectorAll('[data-row-id]'))) {
        const id = row.getAttribute('data-row-id');
        if (id && rowIds.has(id)) {
          row.classList.remove('evolu-row-flash');
        }
      }
    }

    for (const cell of Array.from(container.querySelectorAll('[data-cell-key]'))) {
      const key = cell.getAttribute('data-cell-key');
      if (key && cellKeys.has(key)) {
        cell.classList.remove('evolu-cell-flash');
      }
    }
  }, [tableBodyRef]);

  const detectChanges = useCallback(
    (prev: DbSnapshot, next: DbSnapshot) => {
      const newFlashingCells = new Set<string>();
      const newRowIds = new Set<string>();
      const changedTables = new Map<string, { rows: Set<number>; rowIds: Set<string>; cols: Set<string>; isNewRows: boolean }>();

      for (const [tableName, nextData] of next.tableData) {
        const prevData = prev.tableData.get(tableName);
        if (!prevData) continue;

        const prevMap = prevValuesRef.current.get(tableName) || new Map();
        const nextMap = new Map<string, string>();
        const prevIds = prevRowIdsRef.current.get(tableName) || new Set();
        const nextIds = new Set<string>();

        for (let rowIdx = 0; rowIdx < nextData.rows.length; rowIdx++) {
          const row = nextData.rows[rowIdx];
          const rowId = getRowId(row);

          if (rowId) {
            nextIds.add(rowId);
          }

          const isNewRow = rowId !== null && !prevIds.has(rowId);

          if (isNewRow) {
            newRowIds.add(rowId!);
            let entry = changedTables.get(tableName);
            if (!entry) {
              entry = { rows: new Set(), rowIds: new Set(), cols: new Set(), isNewRows: false };
              changedTables.set(tableName, entry);
            }
            entry.rows.add(rowIdx);
            if (rowId) entry.rowIds.add(rowId);
            entry.isNewRows = true;
          }

          for (const col of nextData.columns) {
            const cellKey = rowId ? `${rowId}:${col}` : `${rowIdx}:${col}`;
            const val = formatCellValue(row[col]);
            nextMap.set(cellKey, val);

            if (!isNewRow) {
              const prevVal = prevMap.get(cellKey);
              if (prevVal !== undefined && prevVal !== val) {
                newFlashingCells.add(cellKey);
                let entry = changedTables.get(tableName);
                if (!entry) {
                  entry = { rows: new Set(), rowIds: new Set(), cols: new Set(), isNewRows: false };
                  changedTables.set(tableName, entry);
                }
                entry.rows.add(rowIdx);
                if (rowId) entry.rowIds.add(rowId);
                entry.cols.add(col);
              }
            }
          }
        }

        prevValuesRef.current.set(tableName, nextMap);
        prevRowIdsRef.current.set(tableName, nextIds);
      }

      if (newFlashingCells.size > 0 || newRowIds.size > 0) {
        flashingCellsRef.current = new Set([
          ...flashingCellsRef.current,
          ...newFlashingCells,
        ]);
        requestAnimationFrame(() => applyFlash(flashingCellsRef.current, newRowIds));
        setTimeout(() => {
          for (const key of newFlashingCells) {
            flashingCellsRef.current.delete(key);
          }
          requestAnimationFrame(() => removeFlash(newFlashingCells, newRowIds));
        }, FLASH_DURATION);

        if (onChangesDetected) {
          const changes: ChangeInfo[] = [];
          for (const [tableName, entry] of changedTables) {
            changes.push({
              tableName,
              rowIndices: entry.rows,
              rowIds: entry.rowIds,
              columns: entry.cols,
              isNewRows: entry.isNewRows,
            });
          }
          onChangesDetected(changes);
        }
      }
    },
    [applyFlash, removeFlash, onChangesDetected],
  );

  return detectChanges;
};
