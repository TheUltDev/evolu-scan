import { useCallback, useRef } from 'preact/hooks';
import { formatCellValue } from './format-cell-value';
import { FLASH_DURATION } from '../consts';
import type { DbSnapshot } from '../types';

export const useFlashChanges = (tableBodyRef: { current: HTMLDivElement | null }) => {
  const prevValuesRef = useRef<Map<string, Map<string, string>>>(new Map());
  const flashingCellsRef = useRef<Set<string>>(new Set());

  const applyFlash = useCallback((keys: Set<string>) => {
    const container = tableBodyRef.current;
    if (!container) return;
    const cells = Array.from(container.querySelectorAll('[data-cell-key]'));
    for (const cell of cells) {
      const key = cell.getAttribute('data-cell-key');
      if (key && keys.has(key)) {
        cell.classList.remove('evolu-cell-flash');
        void (cell as HTMLElement).offsetWidth;
        cell.classList.add('evolu-cell-flash');
      }
    }
  }, [tableBodyRef]);

  const removeFlash = useCallback((keys: Set<string>) => {
    const container = tableBodyRef.current;
    if (!container) return;
    const cells = Array.from(container.querySelectorAll('[data-cell-key]'));
    for (const cell of cells) {
      const key = cell.getAttribute('data-cell-key');
      if (key && keys.has(key)) {
        cell.classList.remove('evolu-cell-flash');
      }
    }
  }, [tableBodyRef]);

  const detectChanges = useCallback(
    (prev: DbSnapshot, next: DbSnapshot) => {
      const newFlashing = new Set<string>();
      for (const [tableName, nextData] of next.tableData) {
        const prevData = prev.tableData.get(tableName);
        if (!prevData) continue;
        const prevMap = prevValuesRef.current.get(tableName) || new Map();
        const nextMap = new Map<string, string>();
        for (let rowIdx = 0; rowIdx < nextData.rows.length; rowIdx++) {
          const row = nextData.rows[rowIdx];
          for (const col of nextData.columns) {
            const cellKey = `${rowIdx}:${col}`;
            const val = formatCellValue(row[col]);
            nextMap.set(cellKey, val);
            const prevVal = prevMap.get(cellKey);
            if (prevVal !== undefined && prevVal !== val) {
              newFlashing.add(`${tableName}:${cellKey}`);
            }
          }
        }
        prevValuesRef.current.set(tableName, nextMap);
      }
      if (newFlashing.size > 0) {
        flashingCellsRef.current = new Set([
          ...flashingCellsRef.current,
          ...newFlashing,
        ]);
        requestAnimationFrame(() => applyFlash(flashingCellsRef.current));
        setTimeout(() => {
          for (const key of newFlashing) {
            flashingCellsRef.current.delete(key);
          }
          requestAnimationFrame(() => removeFlash(newFlashing));
        }, FLASH_DURATION);
      }
    },
    [applyFlash, removeFlash],
  );

  return detectChanges;
};
