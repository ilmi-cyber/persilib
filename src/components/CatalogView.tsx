import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Eye,
  BookOpen,
} from 'lucide-react';
import { Book, BookStatus, User, UserRole } from '../types/library';
import { BOOK_CATEGORIES } from '../data/seedData';
import { BookCover } from './BookCover';

interface CatalogViewProps {
  books: Book[];
  currentUser: User;
  onSelectBook: (book: Book) => void;
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  books,
  currentUser,
  onSelectBook,
  onAddBook,
  onEditBook,
  onDeleteBook,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.publisher.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'Semua' || book.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Tersedia' && book.availableStock > 0 && book.status !== BookStatus.ARSIP) ||
        book.status === statusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [books, search, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            {isAdmin ? 'Manajemen Koleksi Buku' : 'Katalog Koleksi Buku'}
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            {isAdmin
              ? 'Kelola judul, kategori, ketersediaan stok, lokasi rak, dan status koleksi.'
              : 'Temukan buku berdasarkan judul, penulis, atau bidang keilmuan lalu pinjam langsung.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddBook}
            className="px-4 py-2.5 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku Baru
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5E4B3C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul buku, nama penulis, ISBN, atau penerbit..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter kategori"
              className="px-3.5 py-2.5 text-xs font-medium bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53] text-[#33251B]"
            >
              <option value="Semua">Semua Kategori</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status ketersediaan"
              className="px-3.5 py-2.5 text-xs font-medium bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53] text-[#33251B]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tersedia">Tersedia Dipinjam</option>
              <option value={BookStatus.MENIPIS}>{BookStatus.MENIPIS}</option>
              <option value={BookStatus.HABIS}>{BookStatus.HABIS}</option>
              <option value={BookStatus.ARSIP}>{BookStatus.ARSIP}</option>
            </select>

            <div className="flex items-center gap-1 p-1 bg-[#F2ECE3] rounded-lg border border-[#E5DDD0]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Tampilan Grid"
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#33251B] shadow-xs' : 'text-[#5E4B3C]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Tampilan Tabel"
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#33251B] shadow-xs' : 'text-[#5E4B3C]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#5E4B3C] pt-1 border-t border-[#E5DDD0]">
          <span>
            Menampilkan <strong className="font-mono text-[#33251B]">{filteredBooks.length}</strong>{' '}
            dari <strong className="font-mono text-[#33251B]">{books.length}</strong> judul buku
          </span>
          {(search || selectedCategory !== 'Semua' || statusFilter !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('Semua');
                setStatusFilter('Semua');
              }}
              className="text-[#4A6B53] font-medium hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#5E4B3C] mx-auto opacity-60" />
          <h3 className="font-serif text-lg font-semibold text-[#33251B]">
            Buku Tidak Ditemukan
          </h3>
          <p className="text-xs text-[#5E4B3C] max-w-md mx-auto">
            Tidak ada koleksi yang cocok dengan kata kunci atau filter saat ini. Coba ubah filter
            pencarian Anda.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white border border-[#E5DDD0] rounded-xl p-4 flex flex-col justify-between hover:border-[#4A6B53]/60 transition-colors"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onSelectBook(book)}
                  className="w-full text-left cursor-pointer group"
                >
                  <BookCover book={book} size="md" />
                  <div className="mt-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-[#4A6B53] truncate">
                      {book.category}
                    </p>
                    <h3 className="font-serif text-base font-semibold text-[#33251B] group-hover:text-[#4A6B53] leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#5E4B3C] truncate">{book.author}</p>
                  </div>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DDD0] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums text-[#5E4B3C]">
                    Stok {book.availableStock}/{book.totalStock}
                  </span>
                  <span
                    className={`font-medium ${
                      book.status === BookStatus.TERSEDIA
                        ? 'text-[#2E6F40]'
                        : book.status === BookStatus.MENIPIS
                        ? 'text-[#B45309]'
                        : book.status === BookStatus.HABIS
                        ? 'text-[#B91C1C]'
                        : 'text-[#5E4B3C]'
                    }`}
                  >
                    {book.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectBook(book)}
                    className="flex-1 py-2 px-3 text-xs font-medium text-[#33251B] bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E5DDD0] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isAdmin ? 'Detail' : book.availableStock > 0 ? 'Detail & Pinjam' : 'Detail'}
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditBook(book)}
                        aria-label={`Edit ${book.title}`}
                        className="p-2 text-[#5E4B3C] hover:text-[#33251B] bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E5DDD0] rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBook(book)}
                        aria-label={`Hapus ${book.title}`}
                        className="p-2 text-[#B91C1C] hover:bg-[#FEF2F2] bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DDD0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4B3C]">
                  <th className="py-3 px-4">Buku</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Rak</th>
                  <th className="py-3 px-4 text-right">Stok</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0] text-xs">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-[#FAF7F2]/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <BookCover book={book} size="xs" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectBook(book)}
                            className="font-medium text-[#33251B] hover:text-[#4A6B53] text-left cursor-pointer block truncate max-w-[240px]"
                          >
                            {book.title}
                          </button>
                          <p className="text-[11px] text-[#5E4B3C]">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5E4B3C] whitespace-nowrap">
                      {book.isbn}
                    </td>
                    <td className="py-3 px-4 text-[#5E4B3C] whitespace-nowrap">{book.category}</td>
                    <td className="py-3 px-4 font-mono text-[#5E4B3C] whitespace-nowrap">
                      {book.shelfLocation}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#33251B] whitespace-nowrap">
                      {book.availableStock}/{book.totalStock}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          book.status === BookStatus.TERSEDIA
                            ? 'text-[#2E6F40]'
                            : book.status === BookStatus.MENIPIS
                            ? 'text-[#B45309]'
                            : book.status === BookStatus.HABIS
                            ? 'text-[#B91C1C]'
                            : 'text-[#5E4B3C]'
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectBook(book)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#4A6B53] hover:bg-[#EBF2ED] rounded cursor-pointer"
                        >
                          Detail
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditBook(book)}
                              className="px-2.5 py-1 text-[11px] font-medium text-[#33251B] hover:bg-[#F2ECE3] rounded cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBook(book)}
                              className="px-2.5 py-1 text-[11px] font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
