import React, { useMemo } from 'react';
import {
  BookCopy,
  Users,
  ArrowLeftRight,
  BookOpenCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import {
  ActivityLog,
  Book,
  NavSection,
  NotificationItem,
  Transaction,
  TransactionStatus,
  User,
  UserRole,
} from '../types/library';
import {
  buildDailyStats,
  buildMonthlyStats,
  formatDateID,
  formatRelativeTime,
  formatRupiah,
  getEffectiveFine,
  getEffectiveTransactionStatus,
} from '../utils/libraryHelpers';
import { BorrowingChart, CategoryDistributionChart } from './Charts';

interface AdminDashboardProps {
  books: Book[];
  users: User[];
  transactions: Transaction[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  onNavigate: (section: NavSection) => void;
  onReturnBook: (txId: string) => void;
  onOpenNewBorrow: () => void;
  onOpenAddBook: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  users,
  transactions,
  activities,
  notifications,
  onNavigate,
  onReturnBook,
  onOpenNewBorrow,
  onOpenAddBook,
}) => {
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((s, b) => s + b.totalStock, 0);
    const totalMembers = users.filter((u) => u.role === UserRole.MEMBER).length;
    const activeMembers = users.filter((u) => u.role === UserRole.MEMBER && u.isActive).length;
    const totalTx = transactions.length;

    let activeBorrowed = 0;
    let overdueCount = 0;
    let activeFineTotal = 0;

    transactions.forEach((tx) => {
      const eff = getEffectiveTransactionStatus(tx);
      if (eff === TransactionStatus.DIPINJAM || eff === TransactionStatus.TERLAMBAT) {
        activeBorrowed++;
      }
      if (eff === TransactionStatus.TERLAMBAT) {
        overdueCount++;
        activeFineTotal += getEffectiveFine(tx);
      }
    });

    return {
      totalTitles,
      totalCopies,
      totalMembers,
      activeMembers,
      totalTx,
      activeBorrowed,
      overdueCount,
      activeFineTotal,
    };
  }, [books, users, transactions]);

  const monthlyData = useMemo(() => buildMonthlyStats(transactions, 6), [transactions]);
  const dailyData = useMemo(() => buildDailyStats(transactions, 7), [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      const book = books.find((b) => b.id === tx.bookId);
      if (book) {
        map.set(book.category, (map.get(book.category) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions, books]);

  const liveTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
        .slice(0, 6),
    [transactions]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            Ringkasan Perpustakaan
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            Pantau sirkulasi buku, keterlambatan, dan performa koleksi secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAddBook}
            className="px-4 py-2 text-xs font-medium text-[#33251B] bg-white border border-[#E5DDD0] hover:bg-[#F2ECE3] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </button>
          <button
            type="button"
            onClick={onOpenNewBorrow}
            className="px-4 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Catat Peminjaman
          </button>
        </div>
      </div>

      {/* 5 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Total Koleksi Buku</span>
            <BookCopy className="w-4 h-4 text-[#4A6B53]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {stats.totalTitles}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C] font-mono tabular-nums">
            {stats.totalCopies} eksemplar fisik
          </p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Total Member</span>
            <Users className="w-4 h-4 text-[#4A6B53]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {stats.totalMembers}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C] font-mono tabular-nums">
            {stats.activeMembers} anggota aktif
          </p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Total Transaksi</span>
            <ArrowLeftRight className="w-4 h-4 text-[#4A6B53]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {stats.totalTx}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C]">Seluruh riwayat sirkulasi</p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Sedang Dipinjam</span>
            <BookOpenCheck className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {stats.activeBorrowed}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C]">Eksemplar di luar rak</p>
        </div>

        <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5E4B3C]">
            <span className="text-xs font-medium">Terlambat</span>
            <AlertCircle className="w-4 h-4 text-[#B91C1C]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#B91C1C]">
            {stats.overdueCount}
          </p>
          <p className="mt-1 text-xs text-[#5E4B3C] font-mono tabular-nums">
            Denda berjalan {formatRupiah(stats.activeFineTotal)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BorrowingChart monthlyData={monthlyData} dailyData={dailyData} />
        </div>
        <div>
          <CategoryDistributionChart items={categoryBreakdown} />
        </div>
      </div>

      {/* Realtime Monitoring & Due/Overdue Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitoring Transaksi Realtime */}
        <div className="lg:col-span-2 bg-white border border-[#E5DDD0] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#33251B]">
                Monitoring Transaksi Realtime
              </h3>
              <p className="text-xs text-[#5E4B3C] mt-0.5">
                Aliran peminjaman dan pengembalian terbaru di sistem
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-medium text-[#4A6B53] hover:text-[#3B5743] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              Kelola Semua
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4B3C]">
                  <th className="py-2.5 px-4">Kode</th>
                  <th className="py-2.5 px-4">Buku</th>
                  <th className="py-2.5 px-4">Peminjam</th>
                  <th className="py-2.5 px-4">Jatuh Tempo</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0] text-xs">
                {liveTransactions.map((tx) => {
                  const book = books.find((b) => b.id === tx.bookId);
                  const member = users.find((u) => u.id === tx.userId);
                  const status = getEffectiveTransactionStatus(tx);

                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF7F2]/70 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {tx.transactionCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#33251B] max-w-[190px] truncate">
                        {book?.title ?? 'Buku'}
                      </td>
                      <td className="py-3 px-4 text-[#5E4B3C] whitespace-nowrap">
                        {member?.name ?? 'Member'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {formatDateID(tx.dueDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            status === TransactionStatus.TERLAMBAT
                              ? 'text-[#B91C1C]'
                              : status === TransactionStatus.DIKEMBALIKAN
                              ? 'text-[#2E6F40]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {status === TransactionStatus.TERLAMBAT && (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {status === TransactionStatus.DIKEMBALIKAN && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {status === TransactionStatus.DIPINJAM && <Clock className="w-3.5 h-3.5" />}
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {status !== TransactionStatus.DIKEMBALIKAN ? (
                          <button
                            type="button"
                            onClick={() => onReturnBook(tx.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-[#4A6B53] hover:text-white hover:bg-[#4A6B53] border border-[#4A6B53]/40 rounded-md transition-colors cursor-pointer"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#5E4B3C]">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications + Recent Activities Column */}
        <div className="space-y-6">
          {/* Due & Overdue Notifications */}
          <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD0]">
              <h3 className="font-serif text-base font-semibold text-[#33251B]">
                Peringatan Jatuh Tempo
              </h3>
              <span className="font-mono text-xs tabular-nums text-[#B91C1C] font-semibold">
                {notifications.length} aktif
              </span>
            </div>

            {notifications.length === 0 ? (
              <p className="py-6 text-xs text-center text-[#5E4B3C]">
                Semua pinjaman dalam batas waktu aman.
              </p>
            ) : (
              <div className="divide-y divide-[#E5DDD0] mt-2">
                {notifications.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#33251B] leading-snug">
                        {item.bookTitle}
                      </p>
                      <span
                        className={`text-[11px] font-medium shrink-0 ${
                          item.severity === 'overdue' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                        }`}
                      >
                        {item.severity === 'overdue' ? 'Terlambat' : 'Segera Tempo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E4B3C]">
                      {item.memberName} · {item.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => onReturnBook(item.transactionId)}
                      className="text-[11px] font-medium text-[#4A6B53] hover:underline cursor-pointer"
                    >
                      Proses Pengembalian →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
            <div className="pb-3 border-b border-[#E5DDD0]">
              <h3 className="font-serif text-base font-semibold text-[#33251B]">
                Aktivitas Terbaru
              </h3>
            </div>
            <div className="divide-y divide-[#E5DDD0] mt-1">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="py-3 space-y-1">
                  <p className="text-xs text-[#33251B] leading-relaxed">{act.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#5E4B3C]">
                    <span>{act.actorName}</span>
                    <span className="font-mono tabular-nums">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
