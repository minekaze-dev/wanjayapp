import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, ShieldAlert, X, UserMinus, UserCheck, Shield, Mail, PhoneCall, Trash2, Key, CalendarX } from 'lucide-react';
import { User, RoleType, WhatsAppStatusType } from '../types';

export const Users: React.FC = () => {
  const { users, currentUser, addUser, updateUser, toggleUserStatus, deleteUser, pauseAllUserSchedules, showToast, askConfirmation } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('Sales');
  const [accessCode, setAccessCode] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatusType>('connected');

  // Safety block for Sales trying to access
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-8 text-center max-w-sm mx-auto">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100 uppercase tracking-wider">Akses Terbatas</h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Hanya administrator yang dapat melihat dan memodifikasi direktori user tim sales.</p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Sales');
    setAccessCode('');
    setWhatsappStatus('connected');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setAccessCode(user.accessCode || '');
    setWhatsappStatus(user.whatsappStatus);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string, userName: string) => {
    askConfirmation({
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus user ${userName}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: () => deleteUser(id),
    });
  };

  const handlePauseAllUserSchedules = (id: string, userName: string) => {
    askConfirmation({
      title: 'Matikan Semua Jadwal',
      message: `Apakah Anda yakin ingin menonaktifkan/pause semua jadwal pengiriman milik sales ${userName}? Tindakan ini berguna untuk mencegah kesalahan pengiriman secara massal.`,
      confirmText: 'Ya, Matikan',
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: () => pauseAllUserSchedules(id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !accessCode) {
      showToast('Harap isi semua kolom wajib!', 'warning');
      return;
    }

    const cleanCode = (accessCode || '').trim().toUpperCase();

    // Check code availability
    const codeTaken = users.some(u => (u.accessCode || '').toUpperCase().trim() === cleanCode && (!editingUser || u.id !== editingUser.id));
    if (codeTaken) {
      showToast('Kode akses sudah digunakan oleh user lain!', 'warning');
      return;
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        name,
        email,
        role,
        accessCode: cleanCode,
        whatsappStatus,
      });
    } else {
      addUser({
        name,
        email,
        role,
        accessCode: cleanCode,
        whatsappStatus,
        lastActive: 'Just now',
        disabled: false,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div id="users-view" className="p-4 space-y-4 overflow-hidden flex flex-col flex-1">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-xs shrink-0">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">Direktori Tim Sales</h3>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">Melihat status WhatsApp, peranan, dan mengelola akses pengguna aplikasi (Internal MVP).</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg flex-1 overflow-hidden flex flex-col shadow-xs">
        
        {/* MOBILE VIEW CARDS (md:hidden) */}
        <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 dark:bg-zinc-900/40">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-xl shadow-xs space-y-2.5 relative ${
                user.disabled ? 'opacity-60' : ''
              }`}
            >
              {/* Header: Name, Avatar, and Account Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-100/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 text-xs">
                      {user.name}
                    </h4>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono">
                      Last Active: {user.lastActive}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  user.disabled
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50'
                }`}>
                  {user.disabled ? 'DISABLED' : 'ACTIVE'}
                </span>
              </div>

              {/* Grid content details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100 dark:border-zinc-800/45">
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Email</span>
                  <span className="font-mono text-gray-600 dark:text-zinc-400 break-all">{user.email}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Access Code</span>
                  <span className="font-mono font-bold text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-zinc-700/50 tracking-wider">
                    {user.accessCode || '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Role</span>
                  <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    user.role === 'Admin'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50'
                  }`}>
                    <Shield className="h-2.5 w-2.5" />
                    {user.role}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">WhatsApp</span>
                  <span className={`inline-flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold ${
                    user.whatsappStatus === 'connected'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : user.whatsappStatus === 'reconnecting'
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-red-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      user.whatsappStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : user.whatsappStatus === 'reconnecting'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-red-500'
                    }`} />
                    {user.whatsappStatus === 'connected'
                      ? 'Connected'
                      : user.whatsappStatus === 'reconnecting'
                      ? 'Reconnecting'
                      : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100 dark:border-zinc-800/45">
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`p-1.5 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer h-8 w-8 flex items-center justify-center transition-colors ${
                      user.disabled
                        ? 'hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40'
                        : 'hover:bg-red-50 text-red-500 dark:hover:bg-red-950/40'
                    }`}
                    title={user.disabled ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                  >
                    {user.disabled ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                  </button>
                )}

                {user.role === 'Sales' && (
                  <button
                    onClick={() => handlePauseAllUserSchedules(user.id, user.name)}
                    className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer h-8 w-8 flex items-center justify-center transition-colors"
                    title="Matikan Semua Jadwal Sales"
                  >
                    <CalendarX className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(user)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer h-8 w-8 flex items-center justify-center transition-colors"
                  title="Edit Profil"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                {user.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 dark:hover:bg-red-950/40 rounded-lg border border-gray-150 dark:border-zinc-800/80 cursor-pointer h-8 w-8 flex items-center justify-center transition-colors"
                    title="Hapus User"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW TABLE (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/30 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Nama Pengguna</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4 w-[110px]">Kode Akses</th>
                <th className="py-2.5 px-4 w-[100px]">Role</th>
                <th className="py-2.5 px-4 w-[130px]">WhatsApp Status</th>
                <th className="py-2.5 px-4 w-[110px]">Aktivitas Terakhir</th>
                <th className="py-2.5 px-4 w-[110px]">Status Akun</th>
                <th className="py-2.5 px-4 w-[110px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-xs">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors ${
                    user.disabled ? 'opacity-55' : ''
                  }`}
                >
                  {/* Name and initials */}
                  <td className="py-2 px-4 whitespace-nowrap font-semibold text-gray-800 dark:text-zinc-200">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center font-bold text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-100/30">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-2 px-4 text-gray-600 dark:text-zinc-400 font-mono">
                    {user.email}
                  </td>

                  {/* Kode Akses */}
                  <td className="py-2 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-[10.5px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-zinc-700/50 tracking-wider">
                      {user.accessCode || '-'}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="py-2 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50'
                    }`}>
                      <Shield className="h-2.5 w-2.5" />
                      {user.role}
                    </span>
                  </td>

                  {/* WhatsApp Connection status */}
                  <td className="py-2 px-4 font-semibold">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] ${
                      user.whatsappStatus === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : user.whatsappStatus === 'reconnecting'
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-red-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        user.whatsappStatus === 'connected'
                          ? 'bg-emerald-500 animate-pulse'
                          : user.whatsappStatus === 'reconnecting'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-red-500'
                      }`} />
                      {user.whatsappStatus === 'connected'
                        ? '🟢 Connected'
                        : user.whatsappStatus === 'reconnecting'
                        ? '🟡 Reconnecting'
                        : '🔴 Disconnected'}
                    </span>
                  </td>

                  {/* Last active log */}
                  <td className="py-2 px-4 text-gray-500 dark:text-zinc-400 font-medium">
                    {user.lastActive}
                  </td>

                  {/* Disabled state tag */}
                  <td className="py-2 px-4">
                    <span className={`inline-flex text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      user.disabled
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50'
                    }`}>
                      {user.disabled ? 'DISABLED' : 'ACTIVE'}
                    </span>
                  </td>

                  {/* Actions (disable / edit) */}
                  <td className="py-2 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Disable / Enable button */}
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-1.5 rounded cursor-pointer transition-colors ${
                            user.disabled
                              ? 'hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40'
                              : 'hover:bg-red-50 text-red-500 dark:hover:bg-red-950/40'
                          }`}
                          title={user.disabled ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                        >
                          {user.disabled ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                        </button>
                      )}

                      {/* Off All Schedule button (Sales only) */}
                      {user.role === 'Sales' && (
                        <button
                          onClick={() => handlePauseAllUserSchedules(user.id, user.name)}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded cursor-pointer transition-colors"
                          title="Matikan Semua Jadwal Sales"
                        >
                          <CalendarX className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Edit user button */}
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 rounded cursor-pointer transition-colors"
                        title="Edit Profil"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete user button */}
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 dark:hover:bg-red-950/40 rounded cursor-pointer transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info label */}
        <div className="p-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 text-[10px] text-gray-400 dark:text-zinc-500 font-semibold px-4 flex justify-between">
          <span>Menampilkan {users.length} total users</span>
          <span>Password default seluruh akun: 123456</span>
        </div>
      </div>

      {/* User CRUD modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                {editingUser ? '✏️ Edit User' : '👥 Tambah User'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <UserCheck className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Alamat Email *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="rian@wanjay.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Kode Akses * (Contoh: RIAN777)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Key className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RIAN777"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Role Peranan
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleType)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Status WhatsApp
                  </label>
                  <select
                    value={whatsappStatus}
                    onChange={(e) => setWhatsappStatus(e.target.value as WhatsAppStatusType)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="connected">Connected</option>
                    <option value="reconnecting">Reconnecting</option>
                    <option value="disconnected">Disconnected</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-1 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
