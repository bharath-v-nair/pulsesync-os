import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Book } from '../../types';
import { triggerHaptic } from '../../hooks/useHaptics';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Omit<Book, 'id' | 'completed'>) => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onAddBook,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('0');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !totalPages) return;

    triggerHaptic(20);
    onAddBook({
      title: title.trim(),
      author: author.trim() || 'Unknown Author',
      totalPages: parseInt(totalPages, 10),
      currentPage: parseInt(currentPage, 10) || 0,
    });

    setTitle('');
    setAuthor('');
    setTotalPages('');
    setCurrentPage('0');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#101520] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Add Technical Book
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Book Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Designing Data-Intensive Applications"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1017] border border-white/10 text-white text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Author</label>
            <input
              type="text"
              placeholder="e.g. Martin Kleppmann"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1017] border border-white/10 text-white text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Total Pages</label>
              <input
                type="number"
                required
                min="1"
                placeholder="560"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c1017] border border-white/10 text-white text-xs outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Current Page</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c1017] border border-white/10 text-white text-xs outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 tap-target"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Bookshelf</span>
          </button>
        </form>
      </div>
    </div>
  );
};
