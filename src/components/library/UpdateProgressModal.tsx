import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Book } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface UpdateProgressModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, newPage: number) => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  book,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [page, setPage] = useState('');

  useEffect(() => {
    if (book) {
      setPage(String(book.currentPage));
    }
  }, [book]);

  if (!isOpen || !book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPageNum = parseInt(page, 10);
    if (!isNaN(newPageNum)) {
      triggerHaptic(20);
      onUpdate(book.id, newPageNum);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-[#101520] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white">Update Reading Progress</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{book.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">
              Current Page (out of {book.totalPages})
            </label>
            <input
              type="number"
              required
              min="0"
              max={book.totalPages}
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0c1017] border border-white/10 text-white font-mono font-bold text-base outline-none focus:border-sky-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 tap-target"
          >
            <Check className="w-4 h-4" />
            <span>Save Progression</span>
          </button>
        </form>
      </div>
    </div>
  );
};
