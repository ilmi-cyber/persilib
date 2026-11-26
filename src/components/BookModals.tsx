import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, MapPin, Hash, Edit3, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Book,
  BookCategory,
  BookStatus,
  Transaction,
  User,
  UserRole,
} from '../types/library';
import { BOOK_CATEGORIES, COVER_ASSETS } from '../data/seedData';
import { BookCover } from './BookCover';
import {
  deriveBookStatus,
  formatDateID,
  getEffectiveTransactionStatus,
} from '../utils/libraryHelpers';

interface BookDetailModalProps {
  book: Book | null;
  currentUser: User;
  transactions: Transaction[];
  users: User[];
  onClose: () => void;
  onBorrow: (bookId: string, userId: string, durationDays: number, notes?: string) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  currentUser,
  transactions,
  users,
  onClose,
  onBorrow,
  onEdit,
  onDelete,
}) => {
  const [duration, setDuration] = useState<number>(14);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    users.find((u) => u.role === UserRole.MEMBER && u.isActive)?.id || ''
  );
  const [notes, setNotes] = useState('');

  if (!book) return null;

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const bookHistory = transactions
    .filter((t) => t.bookId === book.id)
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5);

  const alreadyBorrowedByMember =
    !isAdmin &&
    transactions.some(
      (t) =>
        t.bookId === book.id &&
        t.userId === currentUser.id &&
        !t.returnDate
    );

  const canBorrow =
    book.availableStock > 0 &&
    book.status !== BookStatus.ARSIP &&
    (isAdmin ? Boolean(selectedMemberId) : !alreadyBorrowedByMember);

  const activeMembers = users.filter((u) => u.role === UserRole.MEMBER && u.isActive);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241911]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div className="bg-white border border-[#E5DDD0] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD0] sticky top-0 bg-white z-10">
          <p className="text-xs font-medium text-[#5E4B3C]">
            Detail Koleksi · <span className="font-mono">{book.isbn}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail buku"
            className="p-1.5 rounded-lg text-[#5E4B3C] hover:text-[#33251B] hover:bg-[#F2ECE3] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <BookCover book={book} size="lg" className="mx-auto sm:mx-0" />

            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-xs font-medium text-[#4A6B53]">{book.category}</p>
                <h2
                  id="book-detail-title"
                  className="font-serif text-2xl font-semibold text-[#33251B] mt-1 leading-snug"
                >
                  {book.title}
                </h2>
                <p className="text-sm text-[#5E4B3C] mt-1">
                  Oleh <span className="font-medium text-[#33251B]">{book.author}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5E4B3C] py-3 border-y border-[#E5DDD0]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {book.publisher}, <span className="font-mono tabular-nums">{book.year}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {book.shelfLocation}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <BookOpen className="w-3.5 h-3.5" />
                  {book.pages} hlm
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Hash className="w-3.5 h-3.5" />
                  Stok {book.availableStock}/{book.totalStock} ({book.status})
                </span>
              </div>

              <p className="text-sm text-[#33251B] leading-relaxed">{book.description}</p>

              {/* Borrow Control Box */}
              <div className="pt-2">
                {book.status === BookStatus.ARSIP ? (
                  <p className="text-xs font-medium text-[#92400E] bg-[#FEF3C7] px-3.5 py-2.5 rounded-lg">
                    Koleksi ini berstatus Arsip Khusus dan hanya dapat dibaca di tempat.
                  </p>
                ) : alreadyBorrowedByMember ? (
                  <p className="text-xs font-medium text-[#4A6B53] bg-[#EBF2ED] px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Anda sedang meminjam buku ini. Periksa menu Riwayat Transaksi untuk perpanjangan.
                  </p>
                ) : book.availableStock <= 0 ? (
                  <p className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] px-3.5 py-2.5 rounded-lg">
                    Seluruh eksemplar sedang dipinjam. Stok tersedia akan otomatis bertambah saat pengembalian.
                  </p>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {isAdmin && (
                        <div>
                          <label className="block text-xs font-medium text-[#33251B] mb-1">
                            Pinjamkan ke Anggota
                          </label>
                          <select
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                          >
                            {activeMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.memberCode})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-[#33251B] mb-1">
                          Durasi Peminjaman
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                        >
                          <option value={7}>7 Hari</option>
                          <option value={14}>14 Hari (Standar)</option>
                          <option value={21}>21 Hari (Riset)</option>
                        </select>
                      </div>
                      <div className={isAdmin ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-[#33251B] mb-1">
                          Catatan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Keperluan studi / referensi..."
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-[#5E4B3C]">
                        Denda keterlambatan: Rp 2.000/hari setelah jatuh tempo.
                      </span>
                      <button
                        type="button"
                        disabled={!canBorrow}
                        onClick={() => {
                          onBorrow(
                            book.id,
                            isAdmin ? selectedMemberId : currentUser.id,
                            duration,
                            notes.trim() || undefined
                          );
                          onClose();
                        }}
                        className="px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isAdmin ? 'Catat Peminjaman' : 'Pinjam Buku Sekarang'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Borrowers for this book */}
          <div className="pt-4 border-t border-[#E5DDD0]">
            <h3 className="text-sm font-semibold text-[#33251B] mb-3">
              Riwayat Sirkulasi Buku Ini
            </h3>
            {bookHistory.length === 0 ? (
              <p className="text-xs text-[#5E4B3C]">Belum pernah dipinjam.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD0] border border-[#E5DDD0] rounded-lg">
                {bookHistory.map((tx) => {
                  const member = users.find((u) => u.id === tx.userId);
                  const eff = getEffectiveTransactionStatus(tx);
                  return (
                    <div
                      key={tx.id}
                      className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#5E4B3C]">{tx.transactionCode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#33251B]">
                          {member?.name ?? 'Anggota'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-[#5E4B3C]">
                        <span>Pinjam: {formatDateID(tx.borrowDate)}</span>
                        <span
                          className={`font-sans font-medium ${
                            eff === 'Terlambat'
                              ? 'text-[#B91C1C]'
                              : eff === 'Dikembalikan'
                              ? 'text-[#2E6F40]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {eff}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (onEdit || onDelete) && (
            <div className="pt-4 border-t border-[#E5DDD0] flex items-center justify-end gap-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(book);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#33251B] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Koleksi
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(book);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Buku
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BookFormModalProps {
  isOpen: boolean;
  editingBook: Book | null;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  editingBook,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(2026);
  const [category, setCategory] = useState<BookCategory>('Filsafat & Pemikiran');
  const [shelfLocation, setShelfLocation] = useState('Rak A-02');
  const [totalStock, setTotalStock] = useState(4);
  const [pages, setPages] = useState(260);
  const [language, setLanguage] = useState('Indonesia');
  const [statusArchive, setStatusArchive] = useState(false);
  const [coverImage, setCoverImage] = useState<string>(COVER_ASSETS.philosophy);
  const [accentTone, setAccentTone] = useState<Book['accentTone']>('sage');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setIsbn(editingBook.isbn);
      setPublisher(editingBook.publisher);
      setYear(editingBook.year);
      setCategory(editingBook.category);
      setShelfLocation(editingBook.shelfLocation);
      setTotalStock(editingBook.totalStock);
      setPages(editingBook.pages);
      setLanguage(editingBook.language);
      setStatusArchive(editingBook.status === BookStatus.ARSIP);
      setCoverImage(editingBook.coverImage || '');
      setAccentTone(editingBook.accentTone);
      setDescription(editingBook.description);
    } else {
      setTitle('');
      setAuthor('');
      setIsbn(`978-623-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}-1`);
      setPublisher('Pustaka Ilmie');
      setYear(2026);
      setCategory('Filsafat & Pemikiran');
      setShelfLocation('Rak A-03');
      setTotalStock(5);
      setPages(280);
      setLanguage('Indonesia');
      setStatusArchive(false);
      setCoverImage(COVER_ASSETS.philosophy);
      setAccentTone('sage');
      setDescription('');
    }
    setErr('');
  }, [editingBook, isOpen]);

  if (!isOpen) return null;

  const borrowedCount = editingBook
    ? Math.max(0, editingBook.totalStock - editingBook.availableStock)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setErr('Judul, penulis, dan ISBN wajib diisi.');
      return;
    }
    if (totalStock < borrowedCount) {
      setErr(`Total stok tidak boleh kurang dari jumlah yang sedang dipinjam (${borrowedCount}).`);
      return;
    }
    const newAvailable = editingBook ? totalStock - borrowedCount : totalStock;
    const derivedStatus = deriveBookStatus(newAvailable, totalStock, statusArchive);

    onSave(
      {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        publisher: publisher.trim() || 'Pustaka Ilmie',
        year: Number(year) || 2026,
        category,
        shelfLocation: shelfLocation.trim() || 'Rak A-01',
        totalStock: Number(totalStock),
        availableStock: newAvailable,
        status: derivedStatus,
        pages: Number(pages) || 200,
        language: language.trim() || 'Indonesia',
        description:
          description.trim() ||
          'Koleksi referensi resmi Perpustakaan Digital Ilmie Library.',
        coverImage: coverImage || undefined,
        accentTone,
      },
      editingBook?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241911]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-[#E5DDD0] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD0] sticky top-0 bg-white z-10">
          <h2 className="font-serif text-lg font-semibold text-[#33251B]">
            {editingBook ? 'Edit Koleksi Buku' : 'Tambah Koleksi Buku Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form buku"
            className="p-1.5 rounded-lg text-[#5E4B3C] hover:bg-[#F2ECE3] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#33251B] mb-1">Judul Buku</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul buku lengkap"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">Penulis</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nama penulis"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">Penerbit</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={1900}
                  max={2030}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">Total Stok</label>
                <input
                  type="number"
                  value={totalStock}
                  onChange={(e) => setTotalStock(Number(e.target.value))}
                  min={Math.max(1, borrowedCount)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">Lokasi Rak</label>
                <input
                  type="text"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">
                Jumlah Halaman
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                min={10}
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#33251B] mb-1">
                Ilustrasi Sampul
              </label>
              <select
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              >
                <option value={COVER_ASSETS.philosophy}>Botani & Filsafat (Cream/Sage)</option>
                <option value={COVER_ASSETS.architecture}>Arsitektur Klasik (Limestone)</option>
                <option value={COVER_ASSETS.science}>Sains & Astrolab (Ivory)</option>
                <option value={COVER_ASSETS.literature}>Lanskap Sastra (Gouache)</option>
                <option value="">Sampul Tipografi Minimalis</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#33251B] mb-1">Sinopsis</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan isi atau fokus kajian buku..."
                className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD0]">
              <div>
                <p className="text-xs font-medium text-[#33251B]">Status Arsip Khusus</p>
                <p className="text-[11px] text-[#5E4B3C]">
                  Aktifkan jika buku hanya untuk referensi ruang baca (tidak dipinjamkan).
                </p>
              </div>
              <input
                type="checkbox"
                checked={statusArchive}
                onChange={(e) => setStatusArchive(e.target.checked)}
                className="w-4 h-4 accent-[#4A6B53] cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5DDD0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#5E4B3C] hover:text-[#33251B] bg-[#F2ECE3] rounded-lg cursor-pointer whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer whitespace-nowrap"
            >
              {editingBook ? 'Simpan Perubahan' : 'Simpan Buku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  book: Book | null;
  activeBorrowedCount: number;
  onClose: () => void;
  onConfirm: (bookId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  book,
  activeBorrowedCount,
  onClose,
  onConfirm,
}) => {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241911]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-[#E5DDD0] rounded-2xl w-full max-w-md p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#33251B]">Hapus Koleksi Buku?</h3>
            <p className="text-xs text-[#5E4B3C] mt-1">
              Anda akan menghapus <strong className="text-[#33251B]">{book.title}</strong> dari
              katalog Ilmie Library.
            </p>
          </div>
        </div>

        {activeBorrowedCount > 0 && (
          <div className="p-3 rounded-lg bg-[#FEF3C7] text-xs text-[#92400E]">
            Buku ini masih memiliki <strong>{activeBorrowedCount}</strong> transaksi peminjaman
            aktif dan tidak dapat dihapus sebelum dikembalikan.
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#5E4B3C] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded-lg cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={activeBorrowedCount > 0}
            onClick={() => {
              onConfirm(book.id);
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-40 rounded-lg cursor-pointer"
          >
            Ya, Hapus Koleksi
          </button>
        </div>
      </div>
    </div>
  );
};
