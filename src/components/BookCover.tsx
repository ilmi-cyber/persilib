import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Book } from '../types/library';

interface BookCoverProps {
  book: Pick<Book, 'title' | 'author' | 'category' | 'coverImage' | 'accentTone'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_MAP: Record<Book['accentTone'], { bg: string; spine: string; text: string }> = {
  sage: { bg: 'bg-[#EBF2ED]', spine: 'bg-[#4A6B53]', text: 'text-[#241911]' },
  espresso: { bg: 'bg-[#EFE8DF]', spine: 'bg-[#33251B]', text: 'text-[#241911]' },
  sand: { bg: 'bg-[#F3ECE0]', spine: 'bg-[#8A6D4B]', text: 'text-[#241911]' },
  olive: { bg: 'bg-[#E9EFE6]', spine: 'bg-[#5B7052]', text: 'text-[#241911]' },
};

const SIZE_MAP = {
  xs: 'w-10 h-14 rounded',
  sm: 'w-14 h-20 rounded-md',
  md: 'w-full aspect-[3/4] rounded-lg',
  lg: 'w-44 sm:w-52 aspect-[3/4] rounded-xl',
};

export const BookCover: React.FC<BookCoverProps> = ({ book, size = 'md', className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const tone = TONE_MAP[book.accentTone] || TONE_MAP.sage;

  if (book.coverImage && !imgFailed) {
    return (
      <div
        className={`relative overflow-hidden border border-[#E5DDD0] bg-[#F2ECE3] shrink-0 ${SIZE_MAP[size]} ${className}`}
      >
        <img
          src={book.coverImage}
          alt={`Sampul buku ${book.title}`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-[#E5DDD0] flex flex-col justify-between p-3 shrink-0 ${tone.bg} ${SIZE_MAP[size]} ${className}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${tone.spine}`} aria-hidden="true" />
      <div className="pl-2 flex items-center justify-between text-[#5E4B3C]">
        <BookOpen className="w-3.5 h-3.5 opacity-75" />
      </div>
      <div className="pl-2 space-y-1">
        {size !== 'xs' && (
          <>
            <p className={`font-serif font-semibold leading-snug line-clamp-3 text-xs ${tone.text}`}>
              {book.title}
            </p>
            <p className="text-[11px] text-[#5E4B3C] truncate">{book.author}</p>
          </>
        )}
      </div>
    </div>
  );
};
