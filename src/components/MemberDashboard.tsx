import React, { useMemo } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  CalendarClock,
  RotateCcw,
} from 'lucide-react';
import {
  Book,
  NavSection,
  NotificationItem,
  Transaction,
  TransactionStatus,
  User,
} from '../types/library';
import {
  buildDailyStats,
  buildMonthlyStats,
  computeDaysOverdue,
  formatDateID,
  formatRupiah,
  getEffectiveFine,
  getEffectiveTransactionStatus,
} from '../utils/libraryHelpers';
import { BookCover } from './BookCover';
import { BorrowingChart, CategoryDistributionChart } from './Charts';

interface MemberDashboardProps {
  currentUser: User;
  books: Book[];
  transactions: Transaction[];
  notifications: NotificationItem[];
  onNavigate: (section: NavSection) => void;
  onReturnBook: (txId: string) => void;
  onExtendBook: (txId: string) => void;
  onSelectBook: (book: Book) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  books,
  transactions,
  notifications,
  onNavigate,
  onReturnBook,
  onExtendBook,
  onSelectBook,
}) => {
  const myTransactions = useMemo(
    () => transactions.filter((t) => t.userId === currentUser.id),
    [transactions, currentUser.id]
  );

  const activeLoans = useMemo(
    () =>
      myTransactions
        .filter((t) => !t.returnDate && t.status !== TransactionStatus.DIKEMBALIKAN)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [myTransactions]
  );

  const returnedCount = useMemo(
    () =>
      myTransactions.filter(
        (t) => t.returnDate || t.status === TransactionStatus.DIKEMBALIKAN
      ).length,
    [myTransactions]
  );

  const totalPendingFine = useMemo(
    () => activeLoans.reduce((sum, tx) => sum + getEffectiveFine(tx), 0),
    [activeLoans]
  );

  const nearestDue = activeLoans[0] ?? null;

  const myNotifications = useMemo(
    () => notifications.filter((n) => n.userId === currentUser.id),
    [notifications, currentUser.id]
  );

  const monthlyData = useMemo(
    () => buildMonthlyStats(transactions, 6, currentUser.id),
    [transactions, currentUser.id]
  );
  const dailyData = useMemo(
    () => buildDailyStats(transactions, 7, currentUser.id),
    [transactions, currentUser.id]
  );

  const myCategories = useMemo(() => {
    const map = new Map<string, number>();
    myTransactions.forEach((tx) => {
      const book = books.find((b) => b.id === tx.bookId);
      if (book) {
        map.set(book.category, (map.get(book.category) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [myTransactions, books]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            Halo, {currentUser.name}
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            ID Anggota <span className="font-mono">{currentUser.memberCode}</span> · Kelola buku
            pinjaman, tenggat waktu, dan statistik baca Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className="px-4 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Search className="w-4 h-4" />
          Jelajahi Katalog Buku
        </button>
      </div>

      {/* Member Notifications Banner */}
      {myNotifications.length > 0 && (
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#33251B]">
            <AlertTriangle className="w-4 h-4 text-[#B45309]" />
            Pengingat Jatuh Tempo & Keterlambatan ({myNotifications.length})
          </div>
          <div className="divide-y divide-[#E5DDD0]">
            {myNotifications.map((notif) => (
              <div
                key={notif.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-semibold text-[#33251B]">{notif.bookTitle}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      notif.severity === 'overdue' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                    }`}
                  >
                    {notif.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {notif.severity === 'due_soon' && (
                    <button
                      type="button"
                      onClick={() => onExtendBook(notif.transactionId)}
                      className="px-3 py-1.5 text-xs font-medium text-[#33251B] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Perpanjang +7 Hari
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onReturnBook(notif.transactionId)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Kembalikan Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Sedang Dipinjam</span>
            <BookOpen className="w-4 h-4 text-[#4A6B53]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {activeLoans.length} / 5
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C]">Batas kuota peminjaman aktif</p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Jatuh Tempo Terdekat</span>
            <Clock className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="mt-3 font-mono text-xl font-semibold tabular-nums text-[#33251B]">
            {nearestDue ? formatDateID(nearestDue.dueDate) : 'Tidak ada'}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C] truncate">
            {nearestDue
              ? books.find((b) => b.id === nearestDue.bookId)?.title || 'Buku'
              : 'Belum ada pinjaman aktif'}
          </p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Total Riwayat Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E6F40]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {returnedCount}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C]">Buku telah dikembalikan</p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Estimasi Denda Aktif</span>
            <AlertTriangle
              className={`w-4 h-4 ${totalPendingFine > 0 ? 'text-[#B91C1C]' : 'text-[#4A6B53]'}`}
            />
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-semibold tabular-nums ${
              totalPendingFine > 0 ? 'text-[#B91C1C]' : 'text-[#33251B]'
            }`}
          >
            {formatRupiah(totalPendingFine)}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C]">
            {totalPendingFine > 0 ? 'Segera kembalikan buku terlambat' : 'Bebas denda keterlambatan'}
          </p>
        </div>
      </div>

      {/* Active Borrowed Books List */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DDD0]">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#33251B]">
              Buku yang Sedang Dipinjam
            </h2>
            <p className="text-xs text-[#5E4B3C] mt-0.5">
              Pantau sisa masa pinjam dan lakukan pengembalian atau perpanjangan
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-[#4A6B53] hover:underline cursor-pointer whitespace-nowrap"
          >
            Lihat Semua Riwayat →
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-[#5E4B3C]">Anda belum meminjam buku saat ini.</p>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="px-4 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer"
            >
              Cari Buku untuk Dipinjam
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5DDD0] mt-2">
            {activeLoans.map((tx) => {
              const book = books.find((b) => b.id === tx.bookId);
              if (!book) return null;
              const status = getEffectiveTransactionStatus(tx);
              const overdueDays = computeDaysOverdue(tx.dueDate);
              const fine = getEffectiveFine(tx);

              return (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="cursor-pointer shrink-0"
                    >
                      <BookCover book={book} size="sm" />
                    </button>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-[#4A6B53] font-medium">{book.category}</p>
                      <button
                        type="button"
                        onClick={() => onSelectBook(book)}
                        className="text-left font-serif text-base font-semibold text-[#33251B] hover:text-[#4A6B53] cursor-pointer block truncate"
                      >
                        {book.title}
                      </button>
                      <p className="text-xs text-[#5E4B3C]">
                        {book.author} · <span className="font-mono">{tx.transactionCode}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1 font-mono tabular-nums">
                        <span className="text-[#5E4B3C]">
                          Pinjam: {formatDateID(tx.borrowDate)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            status === TransactionStatus.TERLAMBAT
                              ? 'text-[#B91C1C] font-semibold'
                              : overdueDays >= -2
                              ? 'text-[#B45309] font-semibold'
                              : 'text-[#33251B]'
                          }
                        >
                          Jatuh Tempo: {formatDateID(tx.dueDate)}
                          {overdueDays > 0
                            ? ` (Terlambat ${overdueDays} hari · ${formatRupiah(fine)})`
                            : overdueDays === 0
                            ? ' (Hari ini)'
                            : ` (${Math.abs(overdueDays)} hari lagi)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {status !== TransactionStatus.TERLAMBAT && tx.extendedCount < 2 && (
                      <button
                        type="button"
                        onClick={() => onExtendBook(tx.id)}
                        className="px-3 py-2 text-xs font-medium text-[#33251B] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Perpanjang
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onReturnBook(tx.id)}
                      className="px-3.5 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Kembalikan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Statistics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BorrowingChart
            monthlyData={monthlyData}
            dailyData={dailyData}
            title="Statistik Peminjaman Saya"
            subtitle="Tren aktivitas membaca dan pengembalian Anda"
          />
        </div>
        <div>
          <CategoryDistributionChart
            items={myCategories}
            title="Minat Kategori Bacaan"
          />
        </div>
      </div>
    </div>
  );
};
