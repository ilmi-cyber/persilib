import React, { useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { Transaction, User, UserRole } from '../types/library';
import { formatDateID } from '../utils/libraryHelpers';

interface MembersViewProps {
  users: User[];
  transactions: Transaction[];
  onToggleMemberStatus: (userId: string) => void;
  onAddMember: (payload: {
    name: string;
    email: string;
    affiliation: string;
    phone: string;
    password: string;
  }) => { ok: boolean; message?: string };
}

export const MembersView: React.FC<MembersViewProps> = ({
  users,
  transactions,
  onToggleMemberStatus,
  onAddMember,
}) => {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('member123');
  const [err, setErr] = useState('');

  const members = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => u.role === UserRole.MEMBER)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.memberCode.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.affiliation.toLowerCase().includes(q)
      );
  }, [users, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!name.trim() || !email.trim()) {
      setErr('Nama dan email wajib diisi.');
      return;
    }
    const res = onAddMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      affiliation: affiliation.trim() || 'Anggota Umum',
      phone: phone.trim() || '-',
      password: password.trim() || 'member123',
    });
    if (!res.ok) {
      setErr(res.message || 'Gagal menambah anggota.');
      return;
    }
    setName('');
    setEmail('');
    setAffiliation('');
    setPhone('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#33251B]">
            Direktori Anggota Perpustakaan
          </h1>
          <p className="text-sm text-[#5E4B3C] mt-1">
            Kelola keanggotaan member, status aktif, dan beban pinjaman masing-masing anggota.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Daftarkan Member
        </button>
      </div>

      <div className="bg-white border border-[#E5DDD0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5E4B3C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, ID anggota, email, atau fakultas..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
          />
        </div>
        <p className="text-xs text-[#5E4B3C] font-mono tabular-nums">
          Total: {members.length} anggota
        </p>
      </div>

      <div className="bg-white border border-[#E5DDD0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4B3C]">
                <th className="py-3 px-4">ID Anggota</th>
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-4">Afiliasi</th>
                <th className="py-3 px-4">Bergabung</th>
                <th className="py-3 px-4 text-right">Pinjam Aktif</th>
                <th className="py-3 px-4 text-right">Total Riwayat</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0] text-xs">
              {members.map((m) => {
                const mTxs = transactions.filter((t) => t.userId === m.id);
                const activeCount = mTxs.filter((t) => !t.returnDate).length;

                return (
                  <tr key={m.id} className="hover:bg-[#FAF7F2]/80">
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                      {m.memberCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#33251B]">{m.name}</p>
                      <p className="text-[11px] text-[#5E4B3C]">{m.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#5E4B3C]">{m.affiliation}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#5E4B3C] whitespace-nowrap">
                      {formatDateID(m.joinedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#33251B]">
                      {activeCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#5E4B3C]">
                      {mTxs.length}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          m.isActive ? 'text-[#2E6F40]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {m.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleMemberStatus(m.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-[#33251B] bg-[#F2ECE3] hover:bg-[#E5DDD0] rounded cursor-pointer"
                      >
                        {m.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#241911]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E5DDD0] rounded-2xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD0]">
              <h2 className="font-serif text-lg font-semibold text-[#33251B]">
                Daftarkan Anggota Baru
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-[#5E4B3C] hover:bg-[#F2ECE3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {err && (
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] text-xs text-[#991B1B]">{err}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#33251B] mb-1">
                  Fakultas / Instansi
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1">Telepon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#33251B] mb-1">
                    Sandi Awal
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg focus:outline-none focus:border-[#4A6B53]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DDD0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5E4B3C] bg-[#F2ECE3] rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer"
                >
                  Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
