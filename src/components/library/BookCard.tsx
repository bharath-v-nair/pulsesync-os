import React from 'react';
import { Star, Edit3, Trash2 } from 'lucide-react';
import { Book } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface BookCardProps {
  book: Book;
  isActive: boolean;
  onSetActive: (id: string) => void;
  onOpenUpdateProgress: (book: Book) => void;
  onDeleteBook: (id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isActive,
  onSetActive,
  onOpenUpdateProgress,
  onDeleteBook,
}) => {
  const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));

  const handleSetFocus = () => {
    triggerHaptic(15);
    onSetActive(book.id);
  };

  const handleUpdate = () => {
    triggerHaptic(10);
    onOpenUpdateProgress(book);
  };

  const handleDelete = () => {
    if (confirm(`Remove "${book.title}" from library?`)) {
      triggerHaptic(20);
      onDeleteBook(book.id);
    }
  };

  return (
    <div
      className={`matte-card p-4 space-y-3 transition-all ${
        isActive ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="badge-pill bg-amber-500/20 text-amber-300 font-mono text-[9px] uppercase tracking-wider">
                ★ Active Focus
              </span>
            )}
            {book.completed && (
              <span className="badge-pill bg-emerald-500/20 text-emerald-300 font-mono text-[9px] uppercase tracking-wider">
                Completed
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-100 leading-snug">{book.title}</h4>
          <p className="text-xs text-slate-400">{book.author}</p>
        </div>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 tap-target"
          aria-label="Delete book"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-300">
            Page {book.currentPage} of {book.totalPages}
          </span>
          <span className="text-amber-400 font-bold">{percent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              book.completed ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {!isActive && (
          <button
            onClick={handleSetFocus}
            className="flex-1 spring-btn py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 tap-target"
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Set Active</span>
          </button>
        )}

        <button
          onClick={handleUpdate}
          className="flex-1 spring-btn py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 tap-target"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Update Page</span>
        </button>
      </div>
    </div>
  );
};
