export default function SortHeader({ label, field, sortBy, order, onSort }) {
  const active = sortBy === field;
  return (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-left text-sm font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
    >
      <span className="flex items-center gap-1">
        {label}
        {active && <span>{order === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}
