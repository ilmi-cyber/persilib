import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  RotateCcw,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import {
  Book,
  BookStatus,
  Transaction,
  TransactionStatus,
  User,
  UserRole,
} from '../types/library';
import {
  computeDaysOverdue,
  formatDateID,
  formatRupiah,
  getEffectiveFine,
  getEffectiveTransactionStatus,
} from '../utils/libraryHelpers';

interface TransactionsViewProps {
  currentUser: User;
  transactions: Transaction[];
  books: Book[];
  users: User[];
  onBorrowBook: (bookId: string, userId: string, durationDays: number, notes?: string) => void;
  onReturnBook: (txId: string) => void;
  onExtendBook: (txId: string) => void;
  isNewBorrowOpen: boolean;
  setIsNewBorrowOpen: (open: boolean) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentUser,
  transactions,
  books,
  users,
  onBorrowBook,
  onReturnBook,
  onExtendBook,
  isNewBorrowOpen,
  setIsNewBorrowOpen,
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Dipinjam' | 'Terlambat' | 'Dikembalikan'>('Semua');

  // New Borrow modal form state
  const availableBooks = books.filter(
    (b) => b.availableStock > 0 && b.status !== BookStatus.ARSIP
  );
  const activeMembers = users.filter((u) => u.role === UserRole.MEMBER && u.isActive);
  const [formBookId, setFormBookId] = useState<string>(availableBooks[0]?.id || '');
  const [formUserId, setFormUserId] = useState<string>(activeMembers[0]?.id || '');
  const [formDuration, setFormDuration] = useState<number>(14);
  const [formNotes, setFormNotes] = useState('');

  const scopedTransactions = useMemo(() => {
    const base = isAdmin
      ? transactions
      : transactions.filter((t) => t.userId === currentUser.id);

    const q = search.trim().toLowerCase();

    return [...base]
      .filter((tx) => {
        const effStatus = getEffectiveTransactionStatus(tx);
        if (statusFilter !== 'Semua' && effStatus !== statusFilter) return false;
        if (!q) return true;
        const book = books.find((b) => b.id === tx.bookId);
        const member = users.find((u) => u.id === tx.userId);
        return (
          tx.transactionCode.toLowerCase().includes(q) ||
          (book?.title.toLowerCase().includes(q) ?? false) ||
          (member?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  }, [transactions, isAdmin, currentUser.id, search, statusFilter, books, users]);

  const counts = useMemo(() => {
    const base = isAdmin
      ? transactions
      : transactions.filter((t) => t.userId === currentUser.id);
    let dipinjam = 0;
    let terlambat = 0;
    let dikembalikan = 0;
    base.forEach((tx) => {
      const s = getEffectiveTransactionStatus(tx);
      if (s === TransactionStatus.DIPINJAM) dipinjam++;
      else if (s === TransactionStatus.TERLAMBAT) terlambat++;
      else dikembalikan++;
    });
    return { all: base.length, dipinjam, terlambat, dikembalikan };
  }, [transactions, isAdmin, currentUser.id]);

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBookId = formBookId || availableBooks[0]?.id;
    const targetUserId = isAdmin ? formUserId || activeMembers[0]?.id : currentUser.id;
    if (!targetBookId || !targetUserId) return;
    onBorrowBook(targetBookId, targetUserId, formDuration, formNotes.trim() || undefined);
    setFormNotes('');
    setIsNewBorrowOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            {isAdmin ? 'Peminjaman, Pengembalian & Monitoring' : 'Riwayat Transaksi Saya'}
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            {isAdmin
              ? 'Catat peminjaman baru, proses pengembalian dengan hitung denda otomatis, dan pantau status.'
              : 'Seluruh catatan peminjaman, jatuh tempo, perpanjangan, dan pengembalian Anda.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewBorrowOpen(true)}
          className="px-4 py-2.5 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isAdmin ? 'Catat Peminjaman Baru' : 'Pinjam Buku'}
        </button>
      </div>

      {/* Filter Tabs + Search */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2ECE3] rounded-lg border border-[#E5DDD0] self-start">
          {(
            [
              { id: 'Semua', label: `Semua (${counts.all})` },
              { id: 'Dipinjam', label: `Dipinjam (${counts.dipinjam})` },
              { id: 'Terlambat', label: `Terlambat (${counts.terlambat})` },
              { id: 'Dikembalikan', label: `Dikembalikan (${counts.dikembalikan})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-[#33251B] shadow-xs'
                  : 'text-[#5E4B3C] hover:text-[#33251B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#5E4B3C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode transaksi, judul, peminjam..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl overflow-hidden">
        {scopedTransactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#5E4B3C]">
            Tidak ada transaksi yang sesuai dengan filter saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4B3C]">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Judul Buku</th>
                  {isAdmin && <th className="py-3 px-4">Peminjam</th>}
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Tgl Kembali</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Denda</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0] text-xs">
                {scopedTransactions.map((tx) => {
                  const book = books.find((b) => b.id === tx.bookId);
                  const member = users.find((u) => u.id === tx.userId);
                  const effStatus = getEffectiveTransactionStatus(tx);
                  const effFine = getEffectiveFine(tx);
                  const overdueDays = computeDaysOverdue(tx.dueDate);

                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF7F2]/80">
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {tx.transactionCode}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#33251B] max-w-[220px] truncate">
                        {book?.title ?? 'Buku Terhapus'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-[#33251B] whitespace-nowrap">
                          {member?.name ?? 'Anggota'}
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {formatDateID(tx.borrowDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {formatDateID(tx.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {tx.returnDate ? formatDateID(tx.returnDate) : '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            effStatus === TransactionStatus.TERLAMBAT
                              ? 'text-[#B91C1C]'
                              : effStatus === TransactionStatus.DIKEMBALIKAN
                              ? 'text-[#2E6F40]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {effStatus === TransactionStatus.TERLAMBAT && (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {effStatus === TransactionStatus.DIKEMBALIKAN && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {effStatus === TransactionStatus.DIPINJAM && (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {effStatus}
                          {effStatus === TransactionStatus.TERLAMBAT && overdueDays > 0
                            ? ` (${overdueDays}h)`
                            : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap text-[#33251B]">
                        {effFine > 0 ? formatRupiah(effFine) : 'Rp 0'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {effStatus !== TransactionStatus.DIKEMBALIKAN ? (
                          <div className="inline-flex items-center gap-1.5">
                            {effStatus !== TransactionStatus.TERLAMBAT && tx.extendedCount < 2 && (
                              <button
                                type="button"
                                onClick={() => onExtendBook(tx.id)}
                                title="Perpanjang 7 hari"
                                className="px-2.5 py-1 text-[11px] font-medium text-[#33251B] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CalendarClock className="w-3 h-3" />
                                +7h
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onReturnBook(tx.id)}
                              className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Kembalikan
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#5E4B3C]">Tuntas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Borrow Modal */}
      {isNewBorrowOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#241911]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E5DDD0] rounded-2xl w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD0]">
              <h2 className="font-serif text-lg font-semibold text-[#33251B]">
                {isAdmin ? 'Catat Transaksi Peminjaman Baru' : 'Pinjam Buku Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsNewBorrowOpen(false)}
                className="p-1.5 rounded-lg text-[#5E4B3C] hover:bg-[#F2ECE3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
              {availableBooks.length === 0 ? (
                <p className="text-xs text-[#B91C1C]">
                  Saat ini tidak ada buku dengan stok tersedia untuk dipinjam.
                </p>
              ) : (
                <>
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-medium text-[#33251B] mb-1">
                        Pilih Member Peminjam
                      </label>
                      <select
                        value={formUserId}
                        onChange={(e) => setFormUserId(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
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
                      Pilih Buku Tersedia
                    </label>
                    <select
                      value={formBookId}
                      onChange={(e) => setFormBookId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    >
                      {availableBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} — Stok: {b.availableStock} ({b.shelfLocation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">
                      Durasi Peminjaman
                    </label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    >
                      <option value={7}>7 Hari</option>
                      <option value={14}>14 Hari (Standar)</option>
                      <option value={21}>21 Hari (Riset)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">
                      Catatan Transaksi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Keperluan studi atau referensi..."
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-[#E5DDD0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewBorrowOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5E4B3C] bg-[#F2ECE3] rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={availableBooks.length === 0}
                  className="px-5 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  Simpan Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
