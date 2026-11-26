import { FINE_PER_DAY } from '../data/seedData';
import {
  Book,
  BookStatus,
  NotificationItem,
  ReportPeriodPreset,
  Transaction,
  TransactionStatus,
  User,
} from '../types/library';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateID(isoDate: string, includeTime = false): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  if (includeTime) {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Kemarin';
  if (days < 7) return `${days} hari lalu`;
  return formatDateID(isoDate);
}

export function computeDaysOverdue(dueDateIso: string, referenceIso?: string): number {
  const due = new Date(dueDateIso);
  const ref = referenceIso ? new Date(referenceIso) : new Date();
  // Compare calendar day difference at start of day for clean human counting
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const diffDays = Math.floor((refDay - dueDay) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getEffectiveTransactionStatus(tx: Transaction): TransactionStatus {
  if (tx.status === TransactionStatus.DIKEMBALIKAN || tx.returnDate) {
    return TransactionStatus.DIKEMBALIKAN;
  }
  const overdueDays = computeDaysOverdue(tx.dueDate);
  return overdueDays > 0 ? TransactionStatus.TERLAMBAT : TransactionStatus.DIPINJAM;
}

export function getEffectiveFine(tx: Transaction): number {
  if (tx.status === TransactionStatus.DIKEMBALIKAN || tx.returnDate) {
    return tx.fineAmount;
  }
  const overdueDays = computeDaysOverdue(tx.dueDate);
  return overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0;
}

export function deriveBookStatus(
  availableStock: number,
  totalStock: number,
  explicitArchive = false
): BookStatus {
  if (explicitArchive) return BookStatus.ARSIP;
  if (availableStock <= 0) return BookStatus.HABIS;
  if (availableStock <= 1 || (totalStock >= 4 && availableStock <= Math.floor(totalStock * 0.25))) {
    return BookStatus.MENIPIS;
  }
  return BookStatus.TERSEDIA;
}

export function generateDueNotifications(
  transactions: Transaction[],
  books: Book[],
  users: User[]
): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const tx of transactions) {
    if (tx.returnDate || tx.status === TransactionStatus.DIKEMBALIKAN) continue;
    const book = books.find((b) => b.id === tx.bookId);
    const member = users.find((u) => u.id === tx.userId);
    if (!book || !member) continue;

    const delta = computeDaysOverdue(tx.dueDate);
    if (delta > 0) {
      const fine = delta * FINE_PER_DAY;
      items.push({
        id: `notif-${tx.id}`,
        transactionId: tx.id,
        bookTitle: book.title,
        memberName: member.name,
        userId: member.id,
        severity: 'overdue',
        daysDelta: delta,
        fineEstimate: fine,
        dueDate: tx.dueDate,
        message: `Terlambat ${delta} hari (estimasi denda ${formatRupiah(fine)})`,
      });
    } else if (delta >= -2) {
      const remaining = Math.abs(delta);
      items.push({
        id: `notif-${tx.id}`,
        transactionId: tx.id,
        bookTitle: book.title,
        memberName: member.name,
        userId: member.id,
        severity: 'due_soon',
        daysDelta: delta,
        fineEstimate: 0,
        dueDate: tx.dueDate,
        message:
          remaining === 0
            ? 'Jatuh tempo hari ini sebelum pukul 17:00'
            : `Jatuh tempo dalam ${remaining} hari (${formatDateID(tx.dueDate)})`,
      });
    }
  }

  return items.sort((a, b) => b.daysDelta - a.daysDelta);
}

export interface MonthlyChartPoint {
  label: string;
  monthKey: string;
  borrowed: number;
  returned: number;
}

export function buildMonthlyStats(
  transactions: Transaction[],
  monthsBack = 6,
  filterUserId?: string
): MonthlyChartPoint[] {
  const now = new Date();
  const points: MonthlyChartPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);

    let borrowed = 0;
    let returned = 0;

    for (const tx of transactions) {
      if (filterUserId && tx.userId !== filterUserId) continue;
      const bd = new Date(tx.borrowDate);
      const bKey = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}`;
      if (bKey === key) borrowed++;

      if (tx.returnDate) {
        const rd = new Date(tx.returnDate);
        const rKey = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}`;
        if (rKey === key) returned++;
      }
    }

    points.push({ label, monthKey: key, borrowed, returned });
  }

  return points;
}

export function buildDailyStats(
  transactions: Transaction[],
  daysBack = 7,
  filterUserId?: string
): MonthlyChartPoint[] {
  const now = new Date();
  const points: MonthlyChartPoint[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(d);

    let borrowed = 0;
    let returned = 0;

    for (const tx of transactions) {
      if (filterUserId && tx.userId !== filterUserId) continue;
      if (tx.borrowDate.slice(0, 10) === key) borrowed++;
      if (tx.returnDate && tx.returnDate.slice(0, 10) === key) returned++;
    }

    points.push({ label, monthKey: key, borrowed, returned });
  }

  return points;
}

export function getDateRangeForPreset(
  preset: ReportPeriodPreset,
  customStart: string,
  customEnd: string
): { start: Date | null; end: Date | null; label: string } {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start, end: endOfToday, label: `Hari Ini (${formatDateID(start.toISOString())})` };
    }
    case '7days': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      return {
        start,
        end: endOfToday,
        label: `7 Hari Terakhir (${formatDateID(start.toISOString())} - ${formatDateID(endOfToday.toISOString())})`,
      };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return {
        start,
        end: endOfToday,
        label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now),
      };
    }
    case 'quarter': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      return {
        start,
        end: endOfToday,
        label: `Triwulan Terakhir (${formatDateID(start.toISOString())} - ${formatDateID(endOfToday.toISOString())})`,
      };
    }
    case 'custom': {
      const start = customStart ? new Date(`${customStart}T00:00:00`) : null;
      const end = customEnd ? new Date(`${customEnd}T23:59:59`) : null;
      const label =
        start && end
          ? `${formatDateID(start.toISOString())} - ${formatDateID(end.toISOString())}`
          : 'Rentang Kustom';
      return { start, end, label };
    }
    case 'all':
    default:
      return { start: null, end: null, label: 'Semua Periode Transaksi' };
  }
}
