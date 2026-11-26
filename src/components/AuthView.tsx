import React, { useState } from 'react';
import { BookMarked, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { User, UserRole } from '../types/library';
import { COVER_ASSETS } from '../data/seedData';

interface AuthViewProps {
  onLogin: (email: string, password: string) => { ok: boolean; message?: string };
  onRegister: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    affiliation: string;
    phone: string;
  }) => { ok: boolean; message?: string };
  totalBooks: number;
  totalMembers: number;
  onQuickDemo: (role: UserRole) => void;
  users: User[];
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  totalBooks,
  totalMembers,
  onQuickDemo,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [email, setEmail] = useState('admin@ilmie.id');
  const [password, setPassword] = useState('admin123');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.MEMBER);
  const [regAffiliation, setRegAffiliation] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Mohon masukkan email dan kata sandi.');
      return;
    }
    const res = onLogin(email.trim(), password);
    if (!res.ok) {
      setError(res.message || 'Email atau kata sandi tidak cocok.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName.trim() || !regEmail.trim() || regPassword.length < 6) {
      setError('Nama, email valid, dan kata sandi minimal 6 karakter wajib diisi.');
      return;
    }
    const res = onRegister({
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regRole,
      affiliation: regAffiliation.trim() || 'Anggota Umum',
      phone: regPhone.trim() || '-',
    });
    if (!res.ok) {
      setError(res.message || 'Pendaftaran gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#33251B] flex flex-col lg:flex-row">
      {/* Left Editorial Showcase */}
      <div className="lg:w-[48%] bg-[#33251B] text-[#FAF7F2] p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A6B53] flex items-center justify-center text-white shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-white">
              Ilmie Library
            </span>
          </div>

          <div className="mt-12 max-w-lg">
            <p className="text-xs font-medium tracking-wide text-[#C4D3C7]">
              Sistem Manajemen Perpustakaan Digital
            </p>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold leading-tight text-white">
              Kelola koleksi, sirkulasi pinjaman, dan laporan dalam satu ruang tenang.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#DDD2C5] leading-relaxed">
              Dirancang untuk pustakawan dan anggota agar peminjaman buku, pemantauan jatuh tempo
              secara real-time, serta rekapitulasi laporan PDF dan Excel berjalan akurat.
            </p>
          </div>

          {/* Curated Cover Preview Strip */}
          <div className="mt-10 grid grid-cols-4 gap-3 max-w-md">
            {[
              { src: COVER_ASSETS.philosophy, label: 'Filsafat' },
              { src: COVER_ASSETS.architecture, label: 'Arsitektur' },
              { src: COVER_ASSETS.science, label: 'Sains' },
              { src: COVER_ASSETS.literature, label: 'Sastra' },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="aspect-[3/4] rounded-md overflow-hidden border border-white/15 bg-[#241911]">
                  <img
                    src={item.src}
                    alt={`Koleksi ${item.label}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-[#CFC3B4]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-8 text-sm">
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-white">{totalBooks}</p>
            <p className="text-xs text-[#CFC3B4]">Judul Koleksi Terkurasi</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-white">{totalMembers}</p>
            <p className="text-xs text-[#CFC3B4]">Anggota Terdaftar</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-white">PDF / XLSX</p>
            <p className="text-xs text-[#CFC3B4]">Ekspor Laporan Otomatis</p>
          </div>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E5DDD0] rounded-2xl p-6 sm:p-8">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F2ECE3] rounded-lg border border-[#E5DDD0]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white text-[#33251B] shadow-xs'
                    : 'text-[#5E4B3C] hover:text-[#33251B]'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white text-[#33251B] shadow-xs'
                    : 'text-[#5E4B3C] hover:text-[#33251B]'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]"
              >
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#33251B]">
                    Selamat Datang Kembali
                  </h2>
                  <p className="text-xs text-[#5E4B3C] mt-1">
                    Masuk sebagai Pustakawan (Admin) atau Anggota (Member).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@ilmie.id"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53] text-[#33251B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53] text-[#33251B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E4B3C] hover:text-[#33251B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  Masuk ke Perpustakaan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#33251B]">
                    Registrasi Akun Baru
                  </h2>
                  <p className="text-xs text-[#5E4B3C] mt-1">
                    Buat akun Member untuk meminjam buku atau Admin untuk mengelola sistem.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1">
                    Peran Akun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole(UserRole.MEMBER)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        regRole === UserRole.MEMBER
                          ? 'bg-[#EBF2ED] border-[#4A6B53] text-[#33251B]'
                          : 'bg-[#FAF7F2] border-[#E5DDD0] text-[#5E4B3C]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole(UserRole.ADMIN)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        regRole === UserRole.ADMIN
                          ? 'bg-[#EBF2ED] border-[#4A6B53] text-[#33251B]'
                          : 'bg-[#FAF7F2] border-[#E5DDD0] text-[#5E4B3C]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Rania Putri"
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="rania@ilmie.id"
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">
                      Kata Sandi
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">
                      Instansi / Jurusan
                    </label>
                    <input
                      type="text"
                      value={regAffiliation}
                      onChange={(e) => setRegAffiliation(e.target.value)}
                      placeholder="Fakultas / Profesi"
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#33251B] mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  Daftar & Masuk
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Instant Demo Access */}
            <div className="mt-6 pt-5 border-t border-[#E5DDD0]">
              <p className="text-xs font-medium text-[#5E4B3C] mb-3">
                Akses Cepat Pengujian (Demo 1-Klik):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onQuickDemo(UserRole.ADMIN)}
                  className="py-2 px-3 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] hover:bg-[#F2ECE3] text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#33251B]">Masuk sebagai Admin</p>
                  <p className="text-[11px] font-mono text-[#5E4B3C] truncate">admin@ilmie.id</p>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickDemo(UserRole.MEMBER)}
                  className="py-2 px-3 rounded-lg border border-[#E5DDD0] bg-[#FAF7F2] hover:bg-[#F2ECE3] text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#33251B]">Masuk sebagai Member</p>
                  <p className="text-[11px] font-mono text-[#5E4B3C] truncate">nadia@ilmie.id</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
