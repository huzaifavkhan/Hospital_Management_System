import { ChevronLeft, ChevronRight } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';

export default function Table({
  columns,
  data,
  loading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyActionLabel,
}) {
  const start = data?.length ? (page - 1) * limit + 1 : 0;
  const end = data?.length ? (page - 1) * limit + data.length : 0;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="table-header" style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {loading ? (
              <SkeletonLoader rows={5} cols={columns.length} />
            ) : !data?.length ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    actionLabel={emptyActionLabel}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && data?.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {start}–{end} of {total} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
