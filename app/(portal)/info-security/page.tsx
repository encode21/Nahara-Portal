"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SecurityStaff, SecurityUser, SecurityNotification } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Plus, Pencil, Trash2, Phone, Bell, Shield, UserPlus, CheckCheck } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

type Tab = "petugas" | "notifikasi" | "users";

export default function InfoSecurityPage() {
  const supabase = createClient();
  const { isAdmin, isSecurity, user, loading: authLoading } = useAuth();
  const canViewNotifications = isAdmin || isSecurity;

  const [tab, setTab] = useState<Tab>("petugas");
  const [staffList, setStaffList] = useState<SecurityStaff[]>([]);
  const [userList, setUserList] = useState<SecurityUser[]>([]);
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    nama: "",
    jabatan: "",
    telepon: "",
    is_active: true,
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    nama: "",
    email: "",
    staff_id: "",
    receive_notifications: true,
  });

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("security_staff")
      .select("*")
      .order("nama");
    setStaffList((data ?? []) as SecurityStaff[]);
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from("security_users")
      .select("*")
      .order("nama");
    setUserList((data ?? []) as SecurityUser[]);
  }, [supabase, isAdmin]);

  const fetchNotifications = useCallback(async () => {
    if (!canViewNotifications) return;
    let query = supabase
      .from("security_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (isSecurity && !isAdmin && user?.email) {
      query = query.ilike("user_email", user.email);
    }

    const { data } = await query;
    const items = (data ?? []) as SecurityNotification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.is_read).length);
  }, [supabase, canViewNotifications, isSecurity, isAdmin, user?.email]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStaff(), fetchUsers(), fetchNotifications()]);
    setLoading(false);
  }, [fetchStaff, fetchUsers, fetchNotifications]);

  useEffect(() => {
    if (authLoading) return;
    fetchAll();
  }, [authLoading, fetchAll]);

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    const payload = {
      nama: staffForm.nama,
      jabatan: staffForm.jabatan || null,
      telepon: staffForm.telepon || null,
      is_active: staffForm.is_active,
    };
    const result = editStaffId
      ? await supabase.from("security_staff").update(payload).eq("id", editStaffId)
      : await supabase.from("security_staff").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    setShowStaffForm(false);
    setEditStaffId(null);
    setStaffForm({ nama: "", jabatan: "", telepon: "", is_active: true });
    fetchStaff();
  }

  async function handleDeleteStaff(id: string) {
    if (!isAdmin || !confirm("Hapus petugas keamanan ini?")) return;
    await supabase.from("security_staff").delete().eq("id", id);
    fetchStaff();
  }

  function startEditStaff(s: SecurityStaff) {
    setEditStaffId(s.id);
    setStaffForm({
      nama: s.nama,
      jabatan: s.jabatan ?? "",
      telepon: s.telepon ?? "",
      is_active: s.is_active,
    });
    setShowStaffForm(true);
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    const payload = {
      nama: userForm.nama,
      email: userForm.email.trim().toLowerCase(),
      staff_id: userForm.staff_id || null,
      receive_notifications: userForm.receive_notifications,
    };
    const result = editUserId
      ? await supabase.from("security_users").update(payload).eq("id", editUserId)
      : await supabase.from("security_users").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    setShowUserForm(false);
    setEditUserId(null);
    setUserForm({ nama: "", email: "", staff_id: "", receive_notifications: true });
    fetchUsers();
  }

  async function handleDeleteUser(id: string) {
    if (!isAdmin || !confirm("Hapus user keamanan ini?")) return;
    await supabase.from("security_users").delete().eq("id", id);
    fetchUsers();
  }

  function startEditUser(u: SecurityUser) {
    setEditUserId(u.id);
    setUserForm({
      nama: u.nama,
      email: u.email,
      staff_id: u.staff_id ?? "",
      receive_notifications: u.receive_notifications,
    });
    setShowUserForm(true);
  }

  async function markRead(id: string) {
    if (!canViewNotifications) return;
    await supabase.from("security_notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  }

  async function markAllRead() {
    if (!canViewNotifications) return;
    let query = supabase.from("security_notifications").update({ is_read: true }).eq("is_read", false);
    if (isSecurity && !isAdmin && user?.email) {
      query = query.ilike("user_email", user.email);
    }
    await query;
    fetchNotifications();
  }

  const activeStaff = staffList.filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Info Security</h1>
          <p className="mt-1 text-sm text-slate-400">
            Direktori petugas keamanan & notifikasi pengaduan
          </p>
        </div>
        {canViewNotifications && unreadCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <Bell className="h-3.5 w-3.5" />
            {unreadCount} belum dibaca
          </span>
        )}
      </div>

      {!isAdmin && !isSecurity && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Petugas keamanan login untuk melihat notifikasi pengaduan masuk.
          </p>
          <AdminLoginPrompt message="Login Petugas / Admin" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <TabButton active={tab === "petugas"} onClick={() => setTab("petugas")} icon={Shield}>
          Petugas
        </TabButton>
        {canViewNotifications && (
          <TabButton active={tab === "notifikasi"} onClick={() => setTab("notifikasi")} icon={Bell} badge={unreadCount}>
            Notifikasi
          </TabButton>
        )}
        {isAdmin && (
          <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={UserPlus}>
            User Keamanan
          </TabButton>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading || authLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
      ) : tab === "petugas" ? (
        <PetugasTab
          staffList={activeStaff}
          isAdmin={isAdmin}
          showForm={showStaffForm}
          form={staffForm}
          editId={editStaffId}
          onShowForm={() => { setShowStaffForm(true); setEditStaffId(null); }}
          onHideForm={() => { setShowStaffForm(false); setEditStaffId(null); }}
          onFormChange={setStaffForm}
          onSubmit={handleStaffSubmit}
          onEdit={startEditStaff}
          onDelete={handleDeleteStaff}
        />
      ) : tab === "notifikasi" ? (
        <NotifikasiTab
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      ) : (
        <UsersTab
          userList={userList}
          staffList={staffList}
          showForm={showUserForm}
          form={userForm}
          editId={editUserId}
          onShowForm={() => { setShowUserForm(true); setEditUserId(null); }}
          onHideForm={() => { setShowUserForm(false); setEditUserId(null); }}
          onFormChange={setUserForm}
          onSubmit={handleUserSubmit}
          onEdit={startEditUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-gold/15 text-gold-dark"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
      {badge ? (
        <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function PetugasTab({
  staffList,
  isAdmin,
  showForm,
  form,
  editId,
  onShowForm,
  onHideForm,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
}: {
  staffList: SecurityStaff[];
  isAdmin: boolean;
  showForm: boolean;
  form: { nama: string; jabatan: string; telepon: string; is_active: boolean };
  editId: string | null;
  onShowForm: () => void;
  onHideForm: () => void;
  onFormChange: (f: typeof form) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (s: SecurityStaff) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{staffList.length} petugas aktif</p>
        {isAdmin && (
          <button type="button" onClick={onShowForm} className="btn-primary">
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Petugas
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={onSubmit} className="glass-card space-y-4">
          <h3 className="font-medium text-slate-900">{editId ? "Edit Petugas" : "Petugas Baru"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input className="input" value={form.nama} onChange={(e) => onFormChange({ ...form, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label">Jabatan</label>
              <input className="input" placeholder="Satpam, Koordinator..." value={form.jabatan} onChange={(e) => onFormChange({ ...form, jabatan: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Telepon / WA</label>
              <input className="input" value={form.telepon} onChange={(e) => onFormChange({ ...form, telepon: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.is_active} onChange={(e) => onFormChange({ ...form, is_active: e.target.checked })} />
            Aktif
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" onClick={onHideForm} className="btn-secondary">Batal</button>
          </div>
        </form>
      )}

      {staffList.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada data petugas keamanan.
          {isAdmin && " Tambahkan petugas untuk ditampilkan ke warga."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((s) => (
            <div key={s.id} className="glass-card relative">
              {isAdmin && (
                <div className="absolute right-3 top-3 flex gap-1">
                  <button type="button" onClick={() => onEdit(s)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-gold-dark">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(s.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{s.nama}</p>
                  {s.jabatan && <p className="text-sm text-slate-500">{s.jabatan}</p>}
                  {s.telepon && (
                    <a
                      href={`https://wa.me/${s.telepon.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {s.telepon}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function NotifikasiTab({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: SecurityNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const unread = notifications.filter((n) => !n.is_read);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Notifikasi otomatis saat warga mengirim pengaduan baru.
        </p>
        {unread.length > 0 && (
          <button type="button" onClick={onMarkAllRead} className="btn-secondary text-xs">
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Tandai semua dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada notifikasi. Pastikan user keamanan sudah didaftarkan oleh admin.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card flex flex-wrap items-start justify-between gap-3 ${
                !n.is_read ? "border-l-4 border-l-gold bg-gold/5" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{n.judul}</p>
                  {!n.is_read && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-dark">
                      Baru
                    </span>
                  )}
                </div>
                {n.pesan && <p className="mt-1 text-sm text-slate-600">{n.pesan}</p>}
                <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.pengaduan_id && (
                  <Link href="/pengaduan" className="btn-secondary text-xs">
                    Lihat Pengaduan
                  </Link>
                )}
                {!n.is_read && (
                  <button type="button" onClick={() => onMarkRead(n.id)} className="btn-primary text-xs">
                    Dibaca
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function UsersTab({
  userList,
  staffList,
  showForm,
  form,
  editId,
  onShowForm,
  onHideForm,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
}: {
  userList: SecurityUser[];
  staffList: SecurityStaff[];
  showForm: boolean;
  form: { nama: string; email: string; staff_id: string; receive_notifications: boolean };
  editId: string | null;
  onShowForm: () => void;
  onHideForm: () => void;
  onFormChange: (f: typeof form) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (u: SecurityUser) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="glass-card text-sm text-slate-600">
        <p className="font-medium text-slate-900">Cara setup user keamanan</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-500">
          <li>Buat akun di Supabase Auth dengan email petugas (Authentication → Users → Add user).</li>
          <li>Daftarkan email yang sama di bawah — petugas login lewat halaman Login portal.</li>
          <li>Saat pengaduan masuk, notifikasi otomatis muncul di tab Notifikasi.</li>
        </ol>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{userList.length} user keamanan</p>
        <button type="button" onClick={onShowForm} className="btn-primary">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah User
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="glass-card space-y-4">
          <h3 className="font-medium text-slate-900">{editId ? "Edit User" : "User Keamanan Baru"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input className="input" value={form.nama} onChange={(e) => onFormChange({ ...form, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email (harus sama dengan akun Supabase Auth)</label>
              <input type="email" className="input" value={form.email} onChange={(e) => onFormChange({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hubungkan ke Petugas (opsional)</label>
              <select className="input" value={form.staff_id} onChange={(e) => onFormChange({ ...form, staff_id: e.target.value })}>
                <option value="">— Tidak dihubungkan —</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama}{s.jabatan ? ` — ${s.jabatan}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.receive_notifications}
              onChange={(e) => onFormChange({ ...form, receive_notifications: e.target.checked })}
            />
            Terima notifikasi pengaduan
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" onClick={onHideForm} className="btn-secondary">Batal</button>
          </div>
        </form>
      )}

      {userList.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada user keamanan terdaftar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Notifikasi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.receive_notifications ? (
                      <span className="text-green-700">Aktif</span>
                    ) : (
                      <span className="text-slate-400">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onEdit(u)} className="mr-2 text-gold-dark hover:underline">Edit</button>
                    <button type="button" onClick={() => onDelete(u.id)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
