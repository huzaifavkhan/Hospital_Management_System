import { FileSearch } from 'lucide-react';

export default function EmptyState({ title = 'No results found', description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <FileSearch size={32} className="text-gray-400" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-4">{description}</p>
      )}
      {action && actionLabel && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
