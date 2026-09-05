import React from 'react';
import { BookOpen, Clock, CheckCircle2, Bookmark } from 'lucide-react';
import { Book } from '../../types';

interface LibraryScorecardsProps {
  books: Book[];
}

export const LibraryScorecards: React.FC<LibraryScorecardsProps> = ({ books }) => {
  const totalBooks = books.length;
  const inProgress = books.filter((b) => !b.completed).length;
  const completed = books.filter((b) => b.completed).length;
  const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {/* Total Catalog */}
      <div className="matte-card p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-sky-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="eyebrow text-[9px] text-sky-400">Catalog</span>
        </div>
        <p className="text-2xl font-bold font-mono text-white tabular-nums">
          {totalBooks}
        </p>
        <p className="text-[10px] text-slate-400">books registered</p>
      </div>

      {/* In Progress */}
      <div className="matte-card p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="eyebrow text-[9px] text-amber-400">Reading</span>
        </div>
        <p className="text-2xl font-bold font-mono text-white tabular-nums">
          {inProgress}
        </p>
        <p className="text-[10px] text-slate-400">in progress</p>
      </div>

      {/* Completed */}
      <div className="matte-card p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="eyebrow text-[9px] text-emerald-400">Finished</span>
        </div>
        <p className="text-2xl font-bold font-mono text-white tabular-nums">
          {completed}
        </p>
        <p className="text-[10px] text-slate-400">mastered</p>
      </div>

      {/* Pages Finished */}
      <div className="matte-card p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-purple-400">
          <Bookmark className="w-3.5 h-3.5" />
          <span className="eyebrow text-[9px] text-purple-400">Pages</span>
        </div>
        <p className="text-2xl font-bold font-mono text-white tabular-nums">
          {totalPagesRead}
        </p>
        <p className="text-[10px] text-slate-400">pages finished</p>
      </div>
    </div>
  );
};
