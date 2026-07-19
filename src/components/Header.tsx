import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Link2, Link2Off, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, currentUser, simulateReply, showToast, theme, setTheme, updateUser, logout, askConfirmation } = useApp();

  const handleSimulateReply = () => {
    simulateReply();
  };

  const cycleWhatsAppStatus = () => {
    if (!currentUser) {
      showToast('Harap login terlebih dahulu!', 'warning');
      return;
    }
    let nextStatus: 'connected' | 'reconnecting' | 'disconnected' = 'connected';
    if (currentUser.whatsappStatus === 'connected') {
      nextStatus = 'reconnecting';
    } else if (currentUser.whatsappStatus === 'reconnecting') {
      nextStatus = 'disconnected';
    } else {
      nextStatus = 'connected';
    }

    updateUser({
      ...currentUser,
      whatsappStatus: nextStatus,
    });

    const statusNames = {
      connected: 'Connected',
      reconnecting: 'Reconnecting',
      disconnected: 'Disconnected'
    };
    showToast(`Status WhatsApp disimulasikan: ${statusNames[nextStatus]}`, 'info');
  };

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

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'schedule':
        return 'Schedule';
      case 'inbox':
        return 'Inbox';
      case 'templates':
        return 'Templates';
      case 'users':
        return 'Users';
      case 'settings':
        return 'Settings';
      default:
        return '';
    }
  };

  return (
    <header
      id="app-header"
      className="h-11 bg-white dark:bg-zinc-900 border-b border-gray-150 dark:border-zinc-800/80 px-2 sm:px-4 flex items-center justify-between shrink-0 transition-colors duration-200"
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider truncate">
          {getTitle()}
        </h1>
        {getTitle() && <span className="text-gray-300 dark:text-zinc-700 hidden sm:inline">|</span>}
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium truncate hidden sm:inline">
          Logged in as <span className="font-semibold text-gray-600 dark:text-zinc-400">{currentUser?.name}</span>
        </span>
      </div>

      {/* Action Buttons & Status */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8"
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" />
          ) : (
            <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-700" />
          )}
        </button>

        {/* WhatsApp Status Indicator */}
        <button
          onClick={cycleWhatsAppStatus}
          title="Klik untuk mensimulasikan status koneksi WhatsApp"
          className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 transition-all cursor-pointer group h-7 sm:h-8"
        >
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            currentUser?.whatsappStatus === 'connected'
              ? 'bg-emerald-500 animate-pulse'
              : currentUser?.whatsappStatus === 'reconnecting'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-red-500'
          }`} />
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-zinc-300">
            <span className="hidden xs:inline">WA: </span>
            {
              currentUser?.whatsappStatus === 'connected'
                ? 'Ok'
                : currentUser?.whatsappStatus === 'reconnecting'
                ? 'Wait'
                : 'Err'
            }
          </span>
          <RefreshCw className="h-2.5 w-2.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
        </button>

        {/* Simulate Reply (Auto Reply Detector) */}
        <button
          onClick={handleSimulateReply}
          id="btn-simulate-reply"
          className="flex items-center gap-1 py-1 px-1.5 sm:px-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-[9px] sm:text-[10px] rounded transition-colors cursor-pointer h-7 sm:h-8 shadow-sm"
          title="Simulate incoming WhatsApp message to test follow up logic"
        >
          <Play className="h-2.5 w-2.5 fill-current shrink-0" />
          <span className="hidden xs:inline">Simulate</span>
        </button>

        {/* Mobile Quick Logout */}
        <button
          onClick={handleLogout}
          className="md:hidden p-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center h-7 w-7"
          title="Log Out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
