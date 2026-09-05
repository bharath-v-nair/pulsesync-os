import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Book } from '../../types';
import { LibraryScorecards } from './LibraryScorecards';
import { BookCard } from './BookCard';
import { AddBookModal } from './AddBookModal';
import { UpdateProgressModal } from './UpdateProgressModal';
import { triggerHaptic } from '../../hooks/useHaptics';

interface LibraryViewProps {
  books: Book[];
  activeBookId: string;
  onBack: () => void;
  onSetActiveBook: (id: string) => void;
  onAddBook: (book: Omit<Book, 'id' | 'completed'>) => void;
  onUpdateBookProgress: (id: string, newPage: number) => void;
  onDeleteBook: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  activeBookId,
  onBack,
  onSetActiveBook,
  onAddBook,
  onUpdateBookProgress,
  onDeleteBook,
}) => {
  const [filter, setFilter] = useState<'all' | 'reading' | 'finished'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookForUpdate, setSelectedBookForUpdate] = useState<Book | null>(null);

  const filteredBooks = books.filter((b) => {
    if (filter === 'reading') return !b.completed;
    if (filter === 'finished') return b.completed;
    return true;
  });

  const readingCount = books.filter((b) => !b.completed).length;
  const finishedCount = books.filter((b) => b.completed).length;

  const handleOpenAddModal = () => {
    triggerHaptic(15);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Breadcrumb + Add Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            triggerHaptic(10);
            onBack();
          }}
          className="spring-btn py-2 px-3 rounded-xl bg-[#121724] border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold tap-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleOpenAddModal}
          className="spring-btn py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-500/20 tap-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add Book</span>
        </button>
      </div>

      {/* 4 Real-time Scorecards */}
      <LibraryScorecards books={books} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[#0c1017] p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            filter === 'all'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({books.length})
        </button>
        <button
          onClick={() => setFilter('reading')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            filter === 'reading'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reading ({readingCount})
        </button>
        <button
          onClick={() => setFilter('finished')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            filter === 'finished'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Finished ({finishedCount})
        </button>
      </div>

      {/* Bookshelf Grid */}
      {filteredBooks.length === 0 ? (
        <div className="matte-card p-10 text-center text-slate-400 text-xs">
          No books match this shelf filter. Tap "+ Add Book" above to register a new technical book!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isActive={book.id === activeBookId}
              onSetActive={onSetActiveBook}
              onOpenUpdateProgress={(b) => setSelectedBookForUpdate(b)}
              onDeleteBook={onDeleteBook}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBook={onAddBook}
      />

      <UpdateProgressModal
        book={selectedBookForUpdate}
        isOpen={!!selectedBookForUpdate}
        onClose={() => setSelectedBookForUpdate(null)}
        onUpdate={onUpdateBookProgress}
      />
    </div>
  );
};
