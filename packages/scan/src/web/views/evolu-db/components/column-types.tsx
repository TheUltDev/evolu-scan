export const ColumnTypes = ({ columns }: { columns: Array<{ name: string; type: string }> }) => (
  <div className="flex items-center gap-x-1 px-3 py-1 border-b border-[#1e1e1e] overflow-x-auto">
    {columns.map((col) => (
      <span
        key={col.name}
        className="flex items-center gap-x-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e]"
      >
        <span className="text-neutral-400">{col.name}</span>
        <span className="text-neutral-600">{col.type}</span>
      </span>
    ))}
  </div>
);
