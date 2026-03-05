export interface TableInfo {
  name: string;
  columns: Array<{ name: string; type: string }>;
  rowCount: number;
}

export interface TableData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface DbSnapshot {
  tables: TableInfo[];
  tableData: Map<string, TableData>;
  byteSize: number;
}
