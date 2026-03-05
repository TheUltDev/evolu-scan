export const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'bigint') return String(value);
  if (value instanceof Uint8Array) return `<blob ${value.length}B>`;
  return String(value);
};
