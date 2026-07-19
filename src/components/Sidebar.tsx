import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  FileText,
  Users as UsersIcon,
  Settings as SettingsIcon,
  LogOut,
  MessageSquareCode,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, logout, inbox, schedules, theme, askConfirmation } = useApp();

  const userInbox = currentUser?.role === 'Admin'
    ? inbox
    : inbox.filter((item) =>
        schedules.some((s) => s.whatsappNumber === item.whatsappNumber && s.salesId === currentUser?.id)
      );

  const unreadCount = userInbox.filter((i) => i.unread).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'inbox', label: 'Inbox', icon: Inbox, total: userInbox.length, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'users', label: 'Users', icon: UsersIcon, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    askConfirmation({
      title: 'Konfirmasi Logout',
      message: 'Apakah Anda yakin ingin logout dari aplikasi?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: logout,
    });
  };

  return (
    <aside
      id="sidebar"
      className="hidden md:flex w-56 shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-150 dark:border-zinc-800/80 flex-col justify-between transition-colors duration-200"
    >
      <div className="flex flex-col flex-1 py-4">
        {/* Brand/Logo */}
        <div className="px-2 mb-5 flex items-center justify-center">
          <img
            src={theme === 'dark' ? 'https://imgur.com/u0qx75f.jpg' : 'https://imgur.com/EAZvDdi.jpg'}
            alt="Logo"
            className="h-24 w-full object-contain px-2"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // If item is admin-only and user is not Admin, hide or disable it nicely
            const isRestricted = item.adminOnly && currentUser?.role !== 'Admin';
            if (isRestricted) return null;

            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500 pl-2.5'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'inbox' && (
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-normal">
                      ({item.total})
                    </span>
                  )}
                </div>
                {item.badge !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">New</span>
                    <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
              {(currentUser?.name || '').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-[11px] font-semibold text-gray-800 dark:text-zinc-200 truncate leading-tight">
                {currentUser?.name}
              </h2>
              <p className="text-[9px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                {currentUser?.role} • {currentUser?.whatsappStatus === 'connected' ? '🟢 WA Ok' : '🔴 WA Err'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
