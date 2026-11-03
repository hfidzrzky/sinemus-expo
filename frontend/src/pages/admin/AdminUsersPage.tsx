import React, { useState } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useDebouncedSearch } from '@/hooks';
import {
  useAdminUsersQuery,
  UserPhoneLockBadge,
  UserRoleModal,
  UserDetailModal,
  type AdminUserListItem,
} from '@/features/admin';

export interface AdminUsersPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminUsersPage(_props: AdminUsersPageProps): React.JSX.Element {
  const { currentUser } = useAuth();

  // Headless Debounced Search Hook (350ms delay, min 2 chars, instant UI responsiveness)
  const {
    inputValue: searchTerm,
    debouncedQuery,
    isDebouncing,
    setInputValue: setSearchTerm,
    clearSearch,
    hasQuery,
  } = useDebouncedSearch({ delay: 350, minChars: 2 });

  // Filters state
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'super_admin'>('all');
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserListItem | null>(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  // Query - Menggunakan debouncedQuery agar tidak membebani server pada setiap keystroke
  const { data, isLoading, isFetching, refetch } = useAdminUsersQuery({
    search: debouncedQuery,
    role: roleFilter,
    phone_locked: phoneFilter,
    page: currentPage,
    per_page: 20,
  });

  const users: AdminUserListItem[] = data?.users || [];
  const meta = data?.meta;

  // Stats calculation (SSOT via backend summary with safe fallback)
  const summary = meta?.summary;
  const totalUsers = summary?.total_users ?? meta?.total ?? users.length;
  const superAdminCount =
    summary?.super_admin_count ?? users.filter((u) => u.role === 'super_admin').length;
  const lockedPhoneCount =
    summary?.locked_phone_count ?? users.filter((u) => u.is_phone_locked).length;
  const customerCount = summary?.customer_count ?? Math.max(0, totalUsers - superAdminCount);

  const handleOpenDetail = (id: number) => {
    setSelectedUserId(id);
    setIsDetailOpen(true);
  };

  const handleOpenRoleModal = (userItem: AdminUserListItem) => {
    setSelectedUserForRole(userItem);
    setIsRoleOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Data Pengguna & Tata Kelola Staf
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Daftar akun penonton terdaftar, status penguncian nomor WhatsApp permanen, dan penetapan
            peran Super Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-neutral-800 bg-[#0B0E14] px-3.5 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-4">
          <span className="text-[11px] font-medium text-neutral-400">Total Pengguna</span>
          <p className="mt-1 text-xl font-black text-white">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-4">
          <span className="text-[11px] font-medium text-neutral-400">Staf Super Admin</span>
          <p className="mt-1 text-xl font-black text-emerald-400">{superAdminCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-4">
          <span className="text-[11px] font-medium text-neutral-400">WhatsApp Terkunci</span>
          <p className="mt-1 text-xl font-black text-blue-400">{lockedPhoneCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-4">
          <span className="text-[11px] font-medium text-neutral-400">Customer Biasa</span>
          <p className="mt-1 text-xl font-black text-neutral-300">{customerCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          {isDebouncing ? (
            <Loader2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#0066FF]" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          )}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, email, atau no WhatsApp..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-10 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#0066FF] focus:outline-none"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Bersihkan pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'all' | 'customer' | 'super_admin');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all" className="bg-neutral-900 text-white">
                Semua Peran
              </option>
              <option value="super_admin" className="bg-neutral-900 text-white">
                Super Admin
              </option>
              <option value="customer" className="bg-neutral-900 text-white">
                Customer
              </option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-1.5">
            <select
              value={phoneFilter}
              onChange={(e) => {
                setPhoneFilter(e.target.value as 'all' | 'locked' | 'unlocked');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all" className="bg-neutral-900 text-white">
                Semua Status WA
              </option>
              <option value="locked" className="bg-neutral-900 text-white">
                Terkunci
              </option>
              <option value="unlocked" className="bg-neutral-900 text-white">
                Belum Terkunci
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Nama & Akun Google</th>
                <th className="px-4 py-4">No. WhatsApp (Locked Invariant)</th>
                <th className="px-4 py-4">Peran (Role)</th>
                <th className="px-4 py-4">Pesanan</th>
                <th className="px-4 py-4">Terdaftar</th>
                <th className="px-4 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500" />
                    <span className="mt-2 block text-xs text-neutral-400">
                      Memuat direktori pengguna...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Tidak ada pengguna yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-900/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold uppercase text-neutral-300">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-semibold text-white">{item.name}</span>
                          <span className="text-[11px] text-neutral-400">{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white">{item.phone_number || '-'}</span>
                        <UserPhoneLockBadge
                          isLocked={item.is_phone_locked}
                          phoneNumber={item.phone_number}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {item.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                          <UserIcon className="h-3 w-3" />
                          <span>Customer</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-bold text-white">
                      {item.total_orders_count ?? item.total_paid_transactions ?? 0} Transaksi
                    </td>
                    <td className="px-4 py-4 text-[11px] text-neutral-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:bg-neutral-700"
                          title="Lihat profil detail pengguna"
                        >
                          <Eye className="h-3 w-3 text-neutral-400" />
                          <span>Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 transition hover:bg-blue-500/20"
                          title="Ubah peran staf"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          <span>Peran</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-800 bg-[#0D111A] px-6 py-3 text-xs">
            <span className="text-neutral-400">
              Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} pengguna
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-bold text-white">
                {currentPage} / {meta.last_page}
              </span>
              <button
                type="button"
                disabled={currentPage >= meta.last_page}
                onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUserId(null);
        }}
      />

      <UserRoleModal
        user={selectedUserForRole}
        isOpen={isRoleOpen}
        onClose={() => {
          setIsRoleOpen(false);
          setSelectedUserForRole(null);
        }}
        currentAdminEmail={currentUser?.email}
      />
    </div>
  );
}
