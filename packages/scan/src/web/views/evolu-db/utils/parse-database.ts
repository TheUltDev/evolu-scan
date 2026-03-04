import type { DbSnapshot, TableData, TableInfo } from '../types';

let cachedSqlite3: Awaited<ReturnType<typeof import('@evolu/sqlite-wasm').default>>;
const internalTables = new Set(['sqlite_sequence', '__proto__']);

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
    const columns = colRows.map((r) => ({
      name: r.name as string,
      type: (r.type as string) || 'any',
    }));
    const countResult = db.exec(
      `SELECT COUNT(*) as c FROM "${tableName}"`,
      { returnValue: 'resultRows', rowMode: 'object' },
    ) as Record<string, unknown>[];
    const rowCount = countResult.length > 0 ? (countResult[0].c as number) : 0;
    tables.push({ name: tableName, columns, rowCount });
    const dataRows = db.exec(`SELECT * FROM "${tableName}" LIMIT 500`, {
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as Record<string, unknown>[];
    tableData.set(tableName, {
      columns: columns.map((c) => c.name),
      rows: dataRows,
    });
  }

  db.close();
  return { tables, tableData };
};

async function getSqliteWasm(): Promise<typeof cachedSqlite3> {
  if (cachedSqlite3) return cachedSqlite3;
  const init = (await import('@evolu/sqlite-wasm')).default;
  cachedSqlite3 = await init();
  return cachedSqlite3;
}

function isInternalTable(name: string): boolean {
  return name.startsWith('_') || name.startsWith('sqlite_') || internalTables.has(name);
}
