import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  Clock,
  User,
  RotateCw,
  LogOut,
  Sliders,
  Sparkles,
  HelpCircle,
  Smartphone,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { DelayType } from '../types';

export const Settings: React.FC = () => {
  const {
    theme,
    setTheme,
    defaultDelay,
    setDefaultDelay,
    retryCount,
    setRetryCount,
    salesName,
    setSalesName,
    currentUser,
    logout,
    askConfirmation,
  } = useApp();


  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<'disconnected' | 'qr' | 'connected' | 'reconnecting'>('disconnected');
  const [loadingWa, setLoadingWa] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    let interval: NodeJS.Timeout;
    const fetchWaStatus = async () => {
      try {
        const res = await fetch(`/api/whatsapp/status/${currentUser.id}`);
        const data = await res.json();
        setWaStatus(data.status);
        setQrCodeUrl(data.qrDataUrl);
      } catch (err) {}
    };

    fetchWaStatus();
    interval = setInterval(fetchWaStatus, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleStartWhatsApp = async () => {
    if (!currentUser) return;
    setLoadingWa(true);
    try {
      await fetch('/api/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
    } catch (e) {}
    setLoadingWa(false);
  };

  const handleLogoutWhatsApp = async () => {
    if (!currentUser) return;
    setLoadingWa(true);
    try {
      await fetch('/api/whatsapp/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setWaStatus('disconnected');
      setQrCodeUrl(null);
    } catch (e) {}
    setLoadingWa(false);
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

  return (
    <div id="settings-view" className="w-full max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Settings form options */}
        <div className="md:col-span-2 space-y-4">
          {/* Visual / Theme Preference */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/80 pb-2">
              <Sliders className="h-4 w-4 text-emerald-500" />
              Tampilan Aplikasi
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Tema Mode</h4>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">Pilih tema terang atau gelap sesuai kenyamanan mata Anda.</p>
              </div>

              <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-150 dark:border-zinc-700">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 py-1 px-2.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-150'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Sun className="h-3 w-3 text-amber-500" />
                  Light Mode
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 py-1 px-2.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-zinc-900 text-white shadow-sm border border-zinc-700'
                      : 'text-gray-400 hover:text-zinc-200'
                  }`}
                >
                  <Moon className="h-3 w-3 text-blue-400" />
                  Dark Mode
                </button>
              </div>
            </div>
          </div>

          {/* Sales / User Customization */}
          {currentUser?.role !== 'Admin' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                <User className="h-4 w-4 text-emerald-500" />
                Pengaturan Sales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Nama Tampilan Sales</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Digunakan untuk menggantikan placeholder <code className="bg-gray-100 dark:bg-zinc-800 px-0.5 rounded">{"{{sales}}"}</code> pada template pesan.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                    placeholder="Contoh: Egi"
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery Preferences */}
          {currentUser?.role !== 'Admin' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Konfigurasi Pengiriman
              </h3>

              {/* Default Delay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Default Delay Follow Up</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">Waktu tunggu acak antar pesan WhatsApp untuk menghindari deteksi spam / bot.</p>
                </div>
                <div>
                  <select
                    value={defaultDelay}
                    onChange={(e) => setDefaultDelay(e.target.value as DelayType)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="30-60 detik">30-60 detik</option>
                    <option value="60-120 detik">60-120 detik</option>
                    <option value="2-5 menit">2-5 menit</option>
                  </select>
                </div>
              </div>

              {/* Retry limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Jumlah Percobaan Ulang (Retry)</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">Jika pengiriman gagal, sistem otomatis mencoba kembali sesuai batasan ini.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">Limit:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={retryCount}
                    onChange={(e) => setRetryCount(parseInt(e.target.value, 10) || 3)}
                    className="w-16 px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none text-center"
                  />
                  <span className="text-[10px] text-gray-400 font-medium">kali</span>
                </div>
              </div>
            </div>
          )}

          
          {/* WhatsApp Web Integration */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/80 pb-2">
              <Smartphone className="h-4 w-4 text-emerald-500" />
              Koneksi WhatsApp Web
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  Status: 
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    waStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 border border-emerald-200/50' : 
                    waStatus === 'reconnecting' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 border border-amber-200/50' :
                    'bg-red-50 text-red-600 dark:bg-red-950/30 border border-red-200/50'
                  }`}>
                    {waStatus}
                  </span>
                </h4>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                  Hubungkan nomor WhatsApp untuk mengirim jadwal secara otomatis.
                </p>
              </div>
              
              {waStatus === 'disconnected' && (
                <button
                  onClick={handleStartWhatsApp}
                  disabled={loadingWa}
                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {loadingWa ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                  Generate QR
                </button>
              )}
              
              {waStatus === 'connected' && (
                <button
                  onClick={handleLogoutWhatsApp}
                  disabled={loadingWa}
                  className="w-full sm:w-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200/50 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  Putuskan
                </button>
              )}
            </div>
            
            {waStatus === 'qr' && qrCodeUrl && (
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <p className="text-[10px] text-gray-500 mb-2 font-bold">Scan QR Code di bawah dengan WhatsApp di HP Anda:</p>
                <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm inline-block">
                  <img src={qrCodeUrl} alt="WhatsApp QR Code" className="h-48 w-48 object-contain" />
                </div>
              </div>
            )}
            {waStatus === 'reconnecting' && (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="h-5 w-5 text-emerald-500 animate-spin" />
              </div>
            )}
          </div>

          {/* About Application Information */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/80 pb-2">
              <HelpCircle className="h-4 w-4 text-emerald-500" />
              Tentang WA-NJAY MVP
            </h3>
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
              WA-NJAY dirancang khusus sebagai asisten follow-up WhatsApp internal tim sales. Versi ini terintegrasi langsung dengan database Supabase dan layanan whatsapp-web.js untuk sinkronisasi data secara real-time dan pengiriman pesan otomatis.
            </p>
          </div>

          {/* Danger/Log out panel */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200/50 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar (Log Out) Akun</span>
            </button>
          </div>
        </div>

        {/* Right column - Brand & Version card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-6 shadow-xs flex flex-col items-center justify-center text-center sticky top-4">
            <img
              src={theme === 'dark' ? 'https://imgur.com/u0qx75f.jpg' : 'https://imgur.com/EAZvDdi.jpg'}
              alt="WA-NJAY Logo"
              className="h-56 w-56 max-w-full object-contain mb-5"
            />
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-zinc-400 leading-relaxed">
              Version 1.0.0 Beta  |  Build for The Achievers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
