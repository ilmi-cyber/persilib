import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  FileBarChart2,
  Bell,
  LogOut,
  Menu,
  X,
  BookMarked,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ActivityLog,
  Book,
  BookStatus,
  NavSection,
  Transaction,
  TransactionStatus,
  User,
  UserRole,
} from './types/library';
import {
  INITIAL_ACTIVITIES,
  INITIAL_BOOKS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from './data/seedData';
import {
  deriveBookStatus,
  formatRupiah,
  generateDueNotifications,
  getEffectiveFine,
} from './utils/libraryHelpers';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { MemberDashboard } from './components/MemberDashboard';
import { CatalogView } from './components/CatalogView';
import { TransactionsView } from './components/TransactionsView';
import { MembersView } from './components/MembersView';
import { ReportsView } from './components/ReportsView';
import {
  BookDetailModal,
  BookFormModal,
  DeleteConfirmModal,
} from './components/BookModals';

const STORAGE_KEYS = {
  users: 'ilmie_lib_v1_users',
  books: 'ilmie_lib_v1_books',
  transactions: 'ilmie_lib_v1_transactions',
  activities: 'ilmie_lib_v1_activities',
  sessionUserId: 'ilmie_lib_v1_session_uid',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error';
}

export default function App() {
  const [users, setUsers] = useState<User[]>(() => loadStored(STORAGE_KEYS.users, INITIAL_USERS));
  const [books, setBooks] = useState<Book[]>(() => loadStored(STORAGE_KEYS.books, INITIAL_BOOKS));
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadStored(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS)
  );
  const [activities, setActivities] = useState<ActivityLog[]>(() =>
    loadStored(STORAGE_KEYS.activities, INITIAL_ACTIVITIES)
  );
  const [sessionUserId, setSessionUserId] = useState<string | null>(() =>
    loadStored<string | null>(STORAGE_KEYS.sessionUserId, null)
  );

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modals state
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isNewBorrowOpen, setIsNewBorrowOpen] = useState(false);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sessionUserId, JSON.stringify(sessionUserId));
  }, [sessionUserId]);

  // Auto-refresh live clock tick every 30s so relative timestamps & due alerts stay current
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    const id = String(Date.now());
    setToast({ id, text, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  const currentUser = useMemo(
    () => users.find((u) => u.id === sessionUserId) || null,
    [users, sessionUserId]
  );

  const allNotifications = useMemo(
    () => generateDueNotifications(transactions, books, users),
    [transactions, books, users]
  );

  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return allNotifications;
    return allNotifications.filter((n) => n.userId === currentUser.id);
  }, [allNotifications, currentUser]);

  const pushActivity = (
    type: ActivityLog['type'],
    actorName: string,
    description: string,
    referenceId?: string
  ) => {
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type,
        actorName,
        description,
        timestamp: new Date().toISOString(),
        referenceId,
      },
      ...prev,
    ]);
  };

  // Auth handlers
  const handleLogin = (email: string, password: string) => {
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { ok: false, message: 'Email atau kata sandi salah.' };
    }
    if (!found.isActive) {
      return { ok: false, message: 'Akun anggota ini sedang dinonaktifkan oleh Admin.' };
    }
    setSessionUserId(found.id);
    setActiveNav('dashboard');
    showToast(`Selamat datang kembali, ${found.name}.`);
    return { ok: true };
  };

  const handleRegister = (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    affiliation: string;
    phone: string;
  }) => {
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: 'Email sudah terdaftar di sistem.' };
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      memberCode:
        payload.role === UserRole.ADMIN
          ? `ADM-${String(users.filter((u) => u.role === UserRole.ADMIN).length + 1).padStart(3, '0')}`
          : `MEM-2026-${String(users.filter((u) => u.role === UserRole.MEMBER).length + 50).padStart(3, '0')}`,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      affiliation: payload.affiliation,
      phone: payload.phone,
      joinedAt: new Date().toISOString(),
      isActive: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setSessionUserId(newUser.id);
    setActiveNav('dashboard');
    pushActivity(
      'member_joined',
      newUser.name,
      `Akun ${newUser.role === UserRole.ADMIN ? 'Admin' : 'Member'} baru (${newUser.name}) terdaftar.`
    );
    showToast(`Akun ${newUser.name} berhasil dibuat!`);
    return { ok: true };
  };

  const handleQuickDemo = (role: UserRole) => {
    const target = users.find((u) => u.role === role && u.isActive);
    if (target) {
      setSessionUserId(target.id);
      setActiveNav('dashboard');
      showToast(`Masuk sebagai ${target.name} (${role === UserRole.ADMIN ? 'Admin' : 'Member'}).`);
    }
  };

  const handleLogout = () => {
    setSessionUserId(null);
    setNotifOpen(false);
    setMobileMenuOpen(false);
  };

  // Book CRUD
  const handleSaveBook = (bookData: Omit<Book, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setBooks((prev) =>
        prev.map((b) => (b.id === existingId ? { ...b, ...bookData } : b))
      );
      pushActivity(
        'book_updated',
        currentUser?.name || 'Admin',
        `Memperbarui informasi koleksi "${bookData.title}".`,
        existingId
      );
      showToast(`Koleksi "${bookData.title}" berhasil diperbarui.`);
    } else {
      const newBook: Book = {
        ...bookData,
        id: `bk-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setBooks((prev) => [newBook, ...prev]);
      pushActivity(
        'book_added',
        currentUser?.name || 'Admin',
        `Menambahkan buku baru "${newBook.title}" (${newBook.totalStock} eksemplar).`,
        newBook.id
      );
      showToast(`Buku "${newBook.title}" berhasil ditambahkan ke katalog.`);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    const target = books.find((b) => b.id === bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (target) {
      pushActivity(
        'book_updated',
        currentUser?.name || 'Admin',
        `Menghapus buku "${target.title}" dari katalog.`
      );
      showToast(`Buku "${target.title}" telah dihapus.`);
    }
  };

  // Borrow / Return / Extend
  const handleBorrowBook = (
    bookId: string,
    userId: string,
    durationDays: number,
    notes?: string
  ) => {
    const book = books.find((b) => b.id === bookId);
    const borrower = users.find((u) => u.id === userId);
    if (!book || !borrower) return;

    if (book.availableStock <= 0 || book.status === BookStatus.ARSIP) {
      showToast('Stok buku tidak tersedia untuk dipinjam.', 'error');
      return;
    }

    const activeUserLoans = transactions.filter(
      (t) => t.userId === userId && !t.returnDate
    );
    if (activeUserLoans.length >= 5) {
      showToast(`${borrower.name} sudah mencapai batas maksimal 5 pinjaman aktif.`, 'error');
      return;
    }
    if (activeUserLoans.some((t) => t.bookId === bookId)) {
      showToast(`${borrower.name} masih meminjam judul buku yang sama.`, 'error');
      return;
    }

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + durationDays);
    due.setHours(17, 0, 0, 0);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      transactionCode: `TRX-${now.getFullYear().toString().slice(-2)}${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${String(transactions.length + 101).slice(-3)}`,
      bookId,
      userId,
      borrowDate: now.toISOString(),
      dueDate: due.toISOString(),
      returnDate: null,
      status: TransactionStatus.DIPINJAM,
      fineAmount: 0,
      extendedCount: 0,
      notes,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const nextAvail = Math.max(0, b.availableStock - 1);
        return {
          ...b,
          availableStock: nextAvail,
          status: deriveBookStatus(nextAvail, b.totalStock, b.status === BookStatus.ARSIP),
        };
      })
    );

    pushActivity(
      'borrow',
      borrower.name,
      `Meminjam buku "${book.title}" selama ${durationDays} hari.`,
      newTx.id
    );
    showToast(`Peminjaman "${book.title}" berhasil dicatat (${newTx.transactionCode}).`);
  };

  const handleReturnBook = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || tx.returnDate) return;

    const book = books.find((b) => b.id === tx.bookId);
    const member = users.find((u) => u.id === tx.userId);
    const finalFine = getEffectiveFine(tx);
    const nowIso = new Date().toISOString();

    setTransactions((prev) =>
      prev.map((item) =>
        item.id === txId
          ? {
              ...item,
              returnDate: nowIso,
              status: TransactionStatus.DIKEMBALIKAN,
              fineAmount: finalFine,
            }
          : item
      )
    );

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== tx.bookId) return b;
        const nextAvail = Math.min(b.totalStock, b.availableStock + 1);
        return {
          ...b,
          availableStock: nextAvail,
          status: deriveBookStatus(nextAvail, b.totalStock, b.status === BookStatus.ARSIP),
        };
      })
    );

    pushActivity(
      'return',
      member?.name || currentUser?.name || 'Anggota',
      `Mengembalikan buku "${book?.title ?? 'Buku'}"${
        finalFine > 0 ? ` dengan denda ${formatRupiah(finalFine)}` : ' tepat waktu'
      }.`,
      tx.id
    );
    showToast(
      `Pengembalian "${book?.title ?? 'Buku'}" selesai${
        finalFine > 0 ? ` · Denda: ${formatRupiah(finalFine)}` : ''
      }.`
    );
  };

  const handleExtendBook = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || tx.returnDate) return;
    const book = books.find((b) => b.id === tx.bookId);
    const nextDue = new Date(tx.dueDate);
    nextDue.setDate(nextDue.getDate() + 7);

    setTransactions((prev) =>
      prev.map((item) =>
        item.id === txId
          ? {
              ...item,
              dueDate: nextDue.toISOString(),
              extendedCount: item.extendedCount + 1,
            }
          : item
      )
    );

    pushActivity(
      'extend',
      currentUser?.name || 'Anggota',
      `Memperpanjang masa pinjam "${book?.title ?? 'Buku'}" (+7 hari).`,
      tx.id
    );
    showToast(`Masa pinjam "${book?.title ?? 'Buku'}" diperpanjang 7 hari.`);
  };

  // Member management
  const handleToggleMemberStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
    showToast('Status keanggotaan diperbarui.');
  };

  const handleAddMember = (payload: {
    name: string;
    email: string;
    affiliation: string;
    phone: string;
    password: string;
  }) => {
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: 'Email tersebut sudah terdaftar.' };
    }
    const newMember: User = {
      id: `usr-${Date.now()}`,
      memberCode: `MEM-2026-${String(
        users.filter((u) => u.role === UserRole.MEMBER).length + 50
      ).padStart(3, '0')}`,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: UserRole.MEMBER,
      affiliation: payload.affiliation,
      phone: payload.phone,
      joinedAt: new Date().toISOString(),
      isActive: true,
    };
    setUsers((prev) => [...prev, newMember]);
    pushActivity('member_joined', newMember.name, `Member baru "${newMember.name}" didaftarkan.`);
    showToast(`Member "${newMember.name}" berhasil ditambahkan.`);
    return { ok: true };
  };

  const handleSwitchDemoRole = () => {
    if (!currentUser) return;
    const nextRole =
      currentUser.role === UserRole.ADMIN ? UserRole.MEMBER : UserRole.ADMIN;
    const target = users.find((u) => u.role === nextRole && u.isActive);
    if (target) {
      setSessionUserId(target.id);
      setActiveNav('dashboard');
      setNotifOpen(false);
      showToast(
        `Beralih ke akun ${target.name} (${nextRole === UserRole.ADMIN ? 'Admin' : 'Member'}).`
      );
    }
  };

  const handleResetDemo = () => {
    setUsers(INITIAL_USERS);
    setBooks(INITIAL_BOOKS);
    setTransactions(INITIAL_TRANSACTIONS);
    setActivities(INITIAL_ACTIVITIES);
    showToast('Data simulasi perpustakaan telah dipulihkan ke kondisi awal.');
  };

  if (!currentUser) {
    return (
      <>
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          totalBooks={books.length}
          totalMembers={users.filter((u) => u.role === UserRole.MEMBER).length}
          onQuickDemo={handleQuickDemo}
          users={users}
        />
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#33251B] text-white text-xs font-medium shadow-lg">
            {toast.text}
          </div>
        )}
      </>
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard Admin', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'catalog', label: 'Koleksi Buku', icon: <BookOpen className="w-4 h-4" /> },
        {
          id: 'transactions',
          label: 'Peminjaman & Monitor',
          icon: <ArrowLeftRight className="w-4 h-4" />,
        },
        { id: 'members', label: 'Data Member', icon: <Users className="w-4 h-4" /> },
        { id: 'reports', label: 'Laporan & Export', icon: <FileBarChart2 className="w-4 h-4" /> },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard Saya', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'catalog', label: 'Katalog Buku', icon: <BookOpen className="w-4 h-4" /> },
        {
          id: 'transactions',
          label: 'Riwayat Transaksi',
          icon: <ArrowLeftRight className="w-4 h-4" />,
        },
        { id: 'reports', label: 'Laporan Pribadi', icon: <FileBarChart2 className="w-4 h-4" /> },
      ];

  const activeNavLabel = navItems.find((n) => n.id === activeNav)?.label ?? 'Dashboard';

  const deletingBookActiveCount = deletingBook
    ? transactions.filter((t) => t.bookId === deletingBook.id && !t.returnDate).length
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#33251B] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#E5DDD0] z-30">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E5DDD0]">
          <div className="w-8 h-8 rounded-lg bg-[#4A6B53] text-white flex items-center justify-center shrink-0">
            <BookMarked className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg font-semibold text-[#33251B] whitespace-nowrap">
            Ilmie Library
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#EBF2ED] text-[#3B5743] font-semibold'
                    : 'text-[#5E4B3C] hover:bg-[#FAF7F2] hover:text-[#33251B]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Utility Actions */}
        <div className="p-4 border-t border-[#E5DDD0] space-y-3">
          <div className="px-2">
            <p className="text-xs font-semibold text-[#33251B] truncate">{currentUser.name}</p>
            <p className="text-[11px] text-[#5E4B3C] truncate">
              {isAdmin ? 'Admin Pustakawan' : 'Member Aktif'} ·{' '}
              <span className="font-mono">{currentUser.memberCode}</span>
            </p>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={handleSwitchDemoRole}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#33251B] bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E5DDD0] rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#4A6B53]" />
              Beralih ke {isAdmin ? 'Member' : 'Admin'}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetDemo}
                title="Pulihkan data dummy awal"
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-medium text-[#5E4B3C] hover:text-[#33251B] hover:bg-[#FAF7F2] rounded-lg cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#241911]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white h-full flex flex-col border-r border-[#E5DDD0] z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5DDD0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4A6B53] text-white flex items-center justify-center">
                  <BookMarked className="w-4 h-4" />
                </div>
                <span className="font-serif text-lg font-semibold text-[#33251B]">
                  Ilmie Library
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#5E4B3C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                    activeNav === item.id
                      ? 'bg-[#EBF2ED] text-[#3B5743] font-semibold'
                      : 'text-[#5E4B3C] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-[#E5DDD0] space-y-2">
              <p className="text-xs font-semibold text-[#33251B]">{currentUser.name}</p>
              <button
                type="button"
                onClick={handleSwitchDemoRole}
                className="w-full py-2 px-3 text-xs font-medium bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg text-left"
              >
                Beralih ke {isAdmin ? 'Member' : 'Admin'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] rounded-lg text-left"
              >
                Keluar Akun
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E5DDD0] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden p-2 rounded-lg text-[#33251B] hover:bg-[#F2ECE3] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#5E4B3C] truncate">
              <span className="hidden sm:inline font-medium text-[#33251B]">Ilmie Library</span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#4A6B53] truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifikasi jatuh tempo dan keterlambatan"
              className="relative p-2 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[#33251B] cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {visibleNotifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B91C1C] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                  {visibleNotifications.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('catalog')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Cari Buku
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-[#E5DDD0] rounded-xl shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E5DDD0] flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-xs font-semibold text-[#33251B]">
                    Notifikasi Jatuh Tempo ({visibleNotifications.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-[#5E4B3C] hover:text-[#33251B] cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {visibleNotifications.length === 0 ? (
                  <p className="p-6 text-xs text-center text-[#5E4B3C]">
                    Tidak ada pengingat jatuh tempo atau keterlambatan saat ini.
                  </p>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5DDD0]">
                    {visibleNotifications.map((n) => (
                      <div key={n.id} className="p-3.5 space-y-1.5 hover:bg-[#FAF7F2]">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#33251B]">{n.bookTitle}</p>
                          <span
                            className={`text-[10px] font-semibold shrink-0 ${
                              n.severity === 'overdue' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                            }`}
                          >
                            {n.severity === 'overdue' ? 'TERLAMBAT' : 'SEGERA TEMPO'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5E4B3C]">
                          {isAdmin ? `${n.memberName} · ` : ''}
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleReturnBook(n.transactionId);
                              setNotifOpen(false);
                            }}
                            className="text-[11px] font-medium text-[#4A6B53] hover:underline cursor-pointer"
                          >
                            Kembalikan Buku
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNav('transactions');
                              setNotifOpen(false);
                            }}
                            className="text-[11px] text-[#5E4B3C] hover:underline cursor-pointer"
                          >
                            Lihat Transaksi
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {activeNav === 'dashboard' &&
            (isAdmin ? (
              <AdminDashboard
                books={books}
                users={users}
                transactions={transactions}
                activities={activities}
                notifications={visibleNotifications}
                onNavigate={setActiveNav}
                onReturnBook={handleReturnBook}
                onOpenNewBorrow={() => {
                  setActiveNav('transactions');
                  setIsNewBorrowOpen(true);
                }}
                onOpenAddBook={() => {
                  setEditingBook(null);
                  setBookFormOpen(true);
                }}
              />
            ) : (
              <MemberDashboard
                currentUser={currentUser}
                books={books}
                transactions={transactions}
                notifications={visibleNotifications}
                onNavigate={setActiveNav}
                onReturnBook={handleReturnBook}
                onExtendBook={handleExtendBook}
                onSelectBook={setDetailBook}
              />
            ))}

          {activeNav === 'catalog' && (
            <CatalogView
              books={books}
              currentUser={currentUser}
              onSelectBook={setDetailBook}
              onAddBook={() => {
                setEditingBook(null);
                setBookFormOpen(true);
              }}
              onEditBook={(book) => {
                setEditingBook(book);
                setBookFormOpen(true);
              }}
              onDeleteBook={setDeletingBook}
            />
          )}

          {activeNav === 'transactions' && (
            <TransactionsView
              currentUser={currentUser}
              transactions={transactions}
              books={books}
              users={users}
              onBorrowBook={handleBorrowBook}
              onReturnBook={handleReturnBook}
              onExtendBook={handleExtendBook}
              isNewBorrowOpen={isNewBorrowOpen}
              setIsNewBorrowOpen={setIsNewBorrowOpen}
            />
          )}

          {activeNav === 'members' && isAdmin && (
            <MembersView
              users={users}
              transactions={transactions}
              onToggleMemberStatus={handleToggleMemberStatus}
              onAddMember={handleAddMember}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              currentUser={currentUser}
              transactions={transactions}
              books={books}
              users={users}
              onExportSuccess={(fmt) =>
                showToast(`Laporan periode berhasil diekspor ke format ${fmt}.`)
              }
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <BookDetailModal
        book={detailBook}
        currentUser={currentUser}
        transactions={transactions}
        users={users}
        onClose={() => setDetailBook(null)}
        onBorrow={handleBorrowBook}
        onEdit={
          isAdmin
            ? (book) => {
                setEditingBook(book);
                setBookFormOpen(true);
              }
            : undefined
        }
        onDelete={isAdmin ? setDeletingBook : undefined}
      />

      <BookFormModal
        isOpen={bookFormOpen}
        editingBook={editingBook}
        onClose={() => {
          setBookFormOpen(false);
          setEditingBook(null);
        }}
        onSave={handleSaveBook}
      />

      <DeleteConfirmModal
        book={deletingBook}
        activeBorrowedCount={deletingBookActiveCount}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDeleteBook}
      />

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-medium inline-flex items-center gap-2 ${
            toast.tone === 'error'
              ? 'bg-[#991B1B] text-white'
              : 'bg-[#33251B] text-[#FAF7F2]'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#8FB996] shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
