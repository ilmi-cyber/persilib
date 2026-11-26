export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum BookStatus {
  TERSEDIA = 'Tersedia',
  MENIPIS = 'Stok Menipis',
  HABIS = 'Habis Dipinjam',
  ARSIP = 'Arsip',
}

export enum TransactionStatus {
  DIPINJAM = 'Dipinjam',
  DIKEMBALIKAN = 'Dikembalikan',
  TERLAMBAT = 'Terlambat',
}

export type BookCategory =
  | 'Filsafat & Pemikiran'
  | 'Arsitektur & Desain'
  | 'Sains & Teknologi'
  | 'Sastra & Fiksi'
  | 'Sejarah & Budaya'
  | 'Ekonomi & Manajemen';

export interface User {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  affiliation: string;
  phone: string;
  joinedAt: string;
  isActive: boolean;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  shelfLocation: string;
  totalStock: number;
  availableStock: number;
  status: BookStatus;
  pages: number;
  language: string;
  description: string;
  coverImage?: string;
  accentTone: 'sage' | 'espresso' | 'sand' | 'olive';
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionCode: string;
  bookId: string;
  userId: string;
  borrowDate: string; // ISO string
  dueDate: string; // ISO string
  returnDate: string | null; // ISO string or null
  status: TransactionStatus;
  fineAmount: number;
  extendedCount: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  type: 'borrow' | 'return' | 'overdue' | 'book_added' | 'book_updated' | 'member_joined' | 'extend';
  actorName: string;
  description: string;
  timestamp: string; // ISO string
  referenceId?: string;
}

export interface NotificationItem {
  id: string;
  transactionId: string;
  bookTitle: string;
  memberName: string;
  userId: string;
  severity: 'overdue' | 'due_soon';
  daysDelta: number; // positive = days overdue, 0 or negative = days remaining
  fineEstimate: number;
  dueDate: string;
  message: string;
}

export type ReportPeriodPreset =
  | 'today'
  | '7days'
  | 'this_month'
  | 'quarter'
  | 'all'
  | 'custom';

export type NavSection =
  | 'dashboard'
  | 'catalog'
  | 'transactions'
  | 'members'
  | 'reports';
