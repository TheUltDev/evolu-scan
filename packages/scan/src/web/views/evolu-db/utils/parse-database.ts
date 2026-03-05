import type { DbSnapshot, TableData, TableInfo } from '../types';

let cachedSqlite3: Awaited<ReturnType<typeof import('@evolu/sqlite-wasm').default>>;
const internalTables = new Set(['sqlite_sequence', '__proto__']);

const KNOWN_COLUMN_TYPES: Record<string, string> = {
  createdAt: 'DATE',
  updatedAt: 'DATE',
  isDeleted: 'BOOL',
  ownerId: 'TEXT',
};

function inferColumnType(
  colName: string,
  schemaType: string,
  rows: Record<string, unknown>[],
): string {
  if (KNOWN_COLUMN_TYPES[colName]) return KNOWN_COLUMN_TYPES[colName];
  const upper = schemaType.toUpperCase();
  if (schemaType && upper !== 'ANY') return upper;

  let onlyBoolInts = true;
  let hasNonNull = false;

  for (const row of rows) {
    const val = row[colName];
    if (val === null || val === undefined) continue;
    hasNonNull = true;

    if (typeof val === 'number') {
      if (!Number.isInteger(val)) return 'REAL';
      if (val !== 0 && val !== 1) {
        onlyBoolInts = false;
        return 'INT';
      }
      continue;
    }
    if (typeof val === 'bigint') return 'INT';
    if (typeof val === 'boolean') return 'BOOL';
    if (val instanceof Uint8Array) return 'BLOB';
    if (typeof val === 'string') {
      onlyBoolInts = false;
      if (/^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/.test(val)) return 'DATE';
      return 'TEXT';
    }
  }

  if (hasNonNull && onlyBoolInts) return 'BOOL';
  return 'ANY';
}

export async function parseDatabase(bytes: Uint8Array): Promise<DbSnapshot> {
  const sql = await getSqliteWasm();
  const db = new sql.oo1.DB();
  const dat = sql.wasm.alloc(bytes.length);
  const heap = sql.wasm.heap8u();
  heap.set(bytes, dat);
  const rc = sql.capi.sqlite3_deserialize(
    db.pointer!,
    'main',
    dat,
    bytes.length,
    bytes.length,
    sql.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sql.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  if (rc !== 0) {
    db.close();
    throw new Error(`sqlite3_deserialize failed with code ${rc}`);
  }

  const tables: TableInfo[] = [];
  const tableData = new Map<string, TableData>();
  const tableNames = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    { returnValue: 'resultRows', rowMode: 'array' },
  ) as unknown[];

  for (const row of tableNames) {
    const tableName = (row as unknown[])[0] as string;
    if (isInternalTable(tableName)) continue;
    const colRows = db.exec(`PRAGMA table_info("${tableName}")`, {
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as Record<string, unknown>[];
    const countResult = db.exec(
      `SELECT COUNT(*) as c FROM "${tableName}"`,
      { returnValue: 'resultRows', rowMode: 'object' },
    ) as Record<string, unknown>[];
    const rowCount = countResult.length > 0 ? (countResult[0].c as number) : 0;
    const dataRows = db.exec(`SELECT * FROM "${tableName}" LIMIT 500`, {
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as Record<string, unknown>[];

    const columns = colRows.map((r) => ({
      name: r.name as string,
      type: inferColumnType(r.name as string, r.type as string, dataRows),
    }));

    tables.push({ name: tableName, columns, rowCount });
    tableData.set(tableName, {
      columns: columns.map((c) => c.name),
      rows: dataRows,
    });
  }

  db.close();
  return { tables, tableData, byteSize: bytes.length };
}

async function getSqliteWasm(): Promise<typeof cachedSqlite3> {
  if (cachedSqlite3) return cachedSqlite3;
  const init = (await import('@evolu/sqlite-wasm')).default;
  cachedSqlite3 = await init();
  return cachedSqlite3;
}

function isInternalTable(name: string): boolean {
  return name.startsWith('_') || name.startsWith('sqlite_') || internalTables.has(name);
}
