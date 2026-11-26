import React, { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Calendar, TrendingUp, BookOpen, Users } from 'lucide-react';
import {
  Book,
  ReportPeriodPreset,
  Transaction,
  TransactionStatus,
  User,
  UserRole,
} from '../types/library';
import { BOOK_CATEGORIES } from '../data/seedData';
import {
  formatDateID,
  formatRupiah,
  getDateRangeForPreset,
  getEffectiveFine,
  getEffectiveTransactionStatus,
} from '../utils/libraryHelpers';
import { exportReportToExcel, exportReportToPDF } from '../utils/exportReports';

interface ReportsViewProps {
  currentUser: User;
  transactions: Transaction[];
  books: Book[];
  users: User[];
  onExportSuccess: (format: 'PDF' | 'Excel') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  transactions,
  books,
  users,
  onExportSuccess,
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [preset, setPreset] = useState<ReportPeriodPreset>('this_month');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const periodRange = useMemo(
    () => getDateRangeForPreset(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const filteredTransactions = useMemo(() => {
    const base = isAdmin
      ? transactions
      : transactions.filter((t) => t.userId === currentUser.id);

    return base
      .filter((tx) => {
        const txDate = new Date(tx.borrowDate);
        if (periodRange.start && txDate < periodRange.start) return false;
        if (periodRange.end && txDate > periodRange.end) return false;

        const book = books.find((b) => b.id === tx.bookId);
        if (categoryFilter !== 'Semua' && book?.category !== categoryFilter) return false;

        const effStatus = getEffectiveTransactionStatus(tx);
        if (statusFilter !== 'Semua' && effStatus !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  }, [
    transactions,
    isAdmin,
    currentUser.id,
    periodRange,
    books,
    categoryFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    let activeBorrowed = 0;
    let returnedCount = 0;
    let overdueCount = 0;
    let totalFine = 0;

    const bookCounter = new Map<string, number>();
    const memberCounter = new Map<string, number>();

    filteredTransactions.forEach((tx) => {
      const effStatus = getEffectiveTransactionStatus(tx);
      if (effStatus === TransactionStatus.DIKEMBALIKAN) returnedCount++;
      else activeBorrowed++;

      if (effStatus === TransactionStatus.TERLAMBAT) overdueCount++;
      totalFine += getEffectiveFine(tx);

      bookCounter.set(tx.bookId, (bookCounter.get(tx.bookId) || 0) + 1);
      memberCounter.set(tx.userId, (memberCounter.get(tx.userId) || 0) + 1);
    });

    const topBooks = Array.from(bookCounter.entries())
      .map(([bookId, count]) => ({
        title: books.find((b) => b.id === bookId)?.title ?? 'Buku',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topMembers = Array.from(memberCounter.entries())
      .map(([userId, count]) => ({
        name: users.find((u) => u.id === userId)?.name ?? 'Member',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalTransactions: filteredTransactions.length,
      activeBorrowed,
      returnedCount,
      overdueCount,
      totalFine,
      topBooks,
      topMembers,
    };
  }, [filteredTransactions, books, users]);

  const handleExportPDF = () => {
    exportReportToPDF({
      title: isAdmin
        ? 'Laporan Sirkulasi & Inventaris Perpustakaan'
        : `Laporan Riwayat Peminjaman — ${currentUser.name}`,
      periodLabel: periodRange.label,
      generatedBy: currentUser.name,
      transactions: filteredTransactions,
      books,
      users,
      summary,
    });
    onExportSuccess('PDF');
  };

  const handleExportExcel = () => {
    exportReportToExcel({
      title: isAdmin
        ? 'Laporan Sirkulasi & Inventaris Perpustakaan'
        : `Laporan Riwayat Peminjaman — ${currentUser.name}`,
      periodLabel: periodRange.label,
      generatedBy: currentUser.name,
      transactions: filteredTransactions,
      books,
      users,
      summary,
    });
    onExportSuccess('Excel');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            Sistem Pelaporan Otomatis
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            Susun laporan sirkulasi buku berdasarkan periode transaksi dan ekspor ke PDF atau Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 text-xs font-medium text-[#33251B] bg-white border border-[#E5DDD0] hover:bg-[#F2ECE3] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2E6F40]" />
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2.5 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Period & Filter Controls */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#33251B]">
            <Calendar className="w-4 h-4 text-[#4A6B53]" />
            Pilih Periode Transaksi Otomatis
          </div>
          <span className="text-xs text-[#5E4B3C] font-mono">{periodRange.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F2ECE3] rounded-lg border border-[#E5DDD0] w-fit">
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'quarter', label: 'Triwulan' },
              { id: 'all', label: 'Semua Waktu' },
              { id: 'custom', label: 'Rentang Kustom' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                preset === p.id
                  ? 'bg-white text-[#33251B] shadow-xs'
                  : 'text-[#5E4B3C] hover:text-[#33251B]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {preset === 'custom' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[#5E4B3C] mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#5E4B3C] mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#5E4B3C] mb-1">
              Filter Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg"
            >
              <option value="Semua">Semua Kategori</option>
              {BOOK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5E4B3C] mb-1">
              Filter Status Transaksi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg"
            >
              <option value="Semua">Semua Status</option>
              <option value={TransactionStatus.DIPINJAM}>{TransactionStatus.DIPINJAM}</option>
              <option value={TransactionStatus.TERLAMBAT}>{TransactionStatus.TERLAMBAT}</option>
              <option value={TransactionStatus.DIKEMBALIKAN}>
                {TransactionStatus.DIKEMBALIKAN}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Automated Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-4">
          <p className="text-xs text-[#5E4B3C]">Total Transaksi</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#33251B]">
            {summary.totalTransactions}
          </p>
        </div>
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-4">
          <p className="text-xs text-[#5E4B3C]">Sedang Dipinjam</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#B45309]">
            {summary.activeBorrowed}
          </p>
        </div>
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-4">
          <p className="text-xs text-[#5E4B3C]">Dikembalikan</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#2E6F40]">
            {summary.returnedCount}
          </p>
        </div>
        <div className="bg-white border border-[#E5DDD0] rounded-xl p-4">
          <p className="text-xs text-[#5E4B3C]">Terlambat</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#B91C1C]">
            {summary.overdueCount}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-white border border-[#E5DDD0] rounded-xl p-4">
          <p className="text-xs text-[#5E4B3C]">Akumulasi Denda</p>
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-[#33251B]">
            {formatRupiah(summary.totalFine)}
          </p>
        </div>
      </div>

      {/* Automated Insights: Top Books & Top Members */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5DDD0]">
              <BookOpen className="w-4 h-4 text-[#4A6B53]" />
              <h3 className="font-serif text-base font-semibold text-[#33251B]">
                Buku Paling Sering Dipinjam (Periode Ini)
              </h3>
            </div>
            {summary.topBooks.length === 0 ? (
              <p className="py-4 text-xs text-[#5E4B3C]">Belum ada data pada periode terpilih.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD0] mt-1">
                {summary.topBooks.map((item, i) => (
                  <div key={item.title} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#33251B] font-medium truncate pr-4">
                      {i + 1}. {item.title}
                    </span>
                    <span className="font-mono tabular-nums text-[#4A6B53] font-semibold shrink-0">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5DDD0] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5DDD0]">
              <Users className="w-4 h-4 text-[#4A6B53]" />
              <h3 className="font-serif text-base font-semibold text-[#33251B]">
                Anggota Paling Aktif (Periode Ini)
              </h3>
            </div>
            {summary.topMembers.length === 0 ? (
              <p className="py-4 text-xs text-[#5E4B3C]">Belum ada data pada periode terpilih.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD0] mt-1">
                {summary.topMembers.map((item, i) => (
                  <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#33251B] font-medium truncate pr-4">
                      {i + 1}. {item.name}
                    </span>
                    <span className="font-mono tabular-nums text-[#33251B] font-semibold shrink-0">
                      {item.count} transaksi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Preview Table */}
      <div className="bg-white border border-[#E5DDD0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#4A6B53]" />
            <h3 className="font-serif text-base font-semibold text-[#33251B]">
              Pratinjau Data Laporan ({filteredTransactions.length} baris)
            </h3>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#5E4B3C]">
            Tidak ada transaksi pada periode dan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4B3C]">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Judul Buku</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0] text-xs">
                {filteredTransactions.map((tx) => {
                  const book = books.find((b) => b.id === tx.bookId);
                  const member = users.find((u) => u.id === tx.userId);
                  const status = getEffectiveTransactionStatus(tx);
                  const fine = getEffectiveFine(tx);

                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF7F2]/80">
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {tx.transactionCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#33251B] max-w-[220px] truncate">
                        {book?.title ?? 'Buku'}
                      </td>
                      <td className="py-3 px-4 text-[#5E4B3C] whitespace-nowrap">
                        {book?.category ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-[#33251B] whitespace-nowrap">
                        {member?.name ?? 'Member'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {formatDateID(tx.borrowDate)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                        {formatDateID(tx.dueDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            status === TransactionStatus.TERLAMBAT
                              ? 'text-[#B91C1C]'
                              : status === TransactionStatus.DIKEMBALIKAN
                              ? 'text-[#2E6F40]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#33251B] whitespace-nowrap">
                        {formatRupiah(fine)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
