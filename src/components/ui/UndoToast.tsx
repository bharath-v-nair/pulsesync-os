import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onDismiss }) => {
  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-bounce-short">
      <div className="bg-[#141b29] border border-sky-500/30 shadow-2xl rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-100">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className="spring-btn px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
