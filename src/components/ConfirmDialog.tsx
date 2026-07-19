import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, HelpCircle, Info, X } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
  const { confirmModal, closeConfirmation } = useApp();

  if (!confirmModal || !confirmModal.isOpen) return null;

  const { title, message, confirmText, cancelText, type, onConfirm } = confirmModal;

  const isDanger = type === 'danger';
  const isInfo = type === 'info';

  return (
    <div
      id="custom-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
    >
      <div
        id="confirm-modal-box"
        className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl transition-all transform duration-300 scale-100 animate-scale-up"
      >
        {/* Header bar / indicator */}
        <div className={`h-1.5 w-full ${isDanger ? 'bg-red-500' : isInfo ? 'bg-blue-500' : 'bg-amber-500'}`} />

        {/* Close Button */}
        <button
          onClick={closeConfirmation}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content area */}
        <div className="p-5 md:p-6 flex flex-col items-center text-center">
          {/* Icon Circle */}
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
              isDanger
                ? 'bg-red-50 dark:bg-red-950/30 text-red-500'
                : isInfo
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-500'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="h-5 w-5" />
            ) : isInfo ? (
              <Info className="h-5 w-5" />
            ) : (
              <HelpCircle className="h-5 w-5" />
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-2">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        {/* Action Buttons footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end bg-gray-50/50 dark:bg-zinc-900/40 border-t border-gray-100 dark:border-zinc-850 pt-4">
          <button
            onClick={closeConfirmation}
            className="flex-1 py-1.5 px-3 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-lg transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer shadow-xs ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'
                : isInfo
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
                : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
