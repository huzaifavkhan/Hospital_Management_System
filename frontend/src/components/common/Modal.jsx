import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [onClose]);

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg';

  return createPortal(
    /*
      Outer wrapper: fixed full-screen overlay, centres the dialog.
      The p-4 creates breathing room so the dialog never touches screen edges.
    */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain scroll-smooth animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — sticky so it stays visible while the dialog body scrolls */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100 truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
