import { cn } from '~web/utils/helpers';
import { formatCellValue } from '../utils/format-cell-value';

export const DataTable = ({
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
