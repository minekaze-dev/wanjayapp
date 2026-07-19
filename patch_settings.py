import re
with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("HelpCircle,\n} from 'lucide-react';", "HelpCircle,\n  Smartphone,\n  RefreshCw,\n  QrCode\n} from 'lucide-react';")
content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';")

# 2. Add WA State & Logic inside Settings component
insertion = """
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

  const handleLogout = () => {"""
content = content.replace("  const handleLogout = () => {", insertion)

# 3. Add the WhatsApp connection card before the About Application Information
wa_card = """
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
"""
content = content.replace("{/* About Application Information */}", wa_card + "\n          {/* About Application Information */}")

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)

