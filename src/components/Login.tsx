import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Key, ChevronRight, User as UserIcon, Sun, Moon, MessageSquare, Check, Sparkles, Send } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, users, theme, setTheme } = useApp();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setTimeout(() => {
      login(accessCode);
      setLoading(false);
    }, 400);
  };

  const logoSrc = theme === 'dark' ? 'https://imgur.com/u0qx75f.jpg' : 'https://imgur.com/EAZvDdi.jpg';

  // Floating background chat bubbles
  const backgroundBubbles = [
    {
      text: 'Follow-up otomatis aktif! 🟢',
      position: 'top-[12%] left-[6%] md:left-[10%] lg:left-[15%]',
      delay: 0,
      duration: 6,
      type: 'sales',
    },
    {
      text: 'Siap, pesanan diproses ya kak 👍',
      position: 'top-[45%] left-[3%] md:left-[5%] lg:left-[8%]',
      delay: 1.5,
      duration: 7,
      type: 'customer',
    },
    {
      text: 'Promo Special Achievers! 🚀',
      position: 'bottom-[15%] left-[5%] md:left-[8%] lg:left-[12%]',
      delay: 0.5,
      duration: 5.5,
      type: 'sales',
    },
    {
      text: 'Jadwal Terkirim ke 100 leads! ✅',
      position: 'top-[15%] right-[6%] md:right-[10%] lg:right-[15%]',
      delay: 1,
      duration: 6.5,
      type: 'sales',
    },
    {
      text: 'Halo kak, jadi pesanannya? 😊',
      position: 'top-[48%] right-[3%] md:right-[5%] lg:right-[8%]',
      delay: 2,
      duration: 8,
      type: 'customer',
    },
    {
      text: 'Sudah di-follow up otomatis oleh WA-NJAY',
      position: 'bottom-[18%] right-[5%] md:right-[8%] lg:right-[12%]',
      delay: 1.2,
      duration: 7.2,
      type: 'sales',
    },
  ];

  return (
    <div id="login-container" className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 transition-colors duration-200 relative overflow-hidden">
      
      {/* Immersive Chat Bubbles Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {backgroundBubbles.map((bubble, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0 }}
            animate={{ 
              y: [0, -12, 0],
              opacity: theme === 'dark' ? [0.15, 0.25, 0.15] : [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: bubble.delay,
            }}
            className={`absolute hidden sm:block p-3 rounded-2xl shadow-sm text-xs font-semibold ${bubble.position} transition-all duration-300 border ${
              bubble.type === 'sales'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 rounded-br-none'
                : 'bg-white dark:bg-zinc-900/40 text-gray-700 dark:text-zinc-350 border-gray-150 dark:border-zinc-800/80 rounded-bl-none'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {bubble.type === 'sales' ? <Send className="h-3 w-3 shrink-0 text-emerald-500" /> : <MessageSquare className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500" />}
              <span>{bubble.text}</span>
            </div>
          </motion.div>
        ))}

        {/* Small drifting icons for extra visual interest */}
        <motion.div
          animate={{ rotate: 360, y: [0, 15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[25%] left-[25%] text-emerald-500/10 dark:text-emerald-500/5 hidden lg:block"
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[30%] right-[25%] text-emerald-500/10 dark:text-emerald-500/5 hidden lg:block"
        >
          <Check className="h-8 w-8" />
        </motion.div>
      </div>

      {/* Floating Theme Toggle (Top-Right) */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 shadow-md hover:scale-105 dark:hover:bg-zinc-800 transition-all cursor-pointer text-gray-700 dark:text-zinc-300 flex items-center justify-center z-50 w-9 h-9"
        title="Ubah Tema"
      >
        {theme === 'dark' ? (
          <Sun className="h-4.5 w-4.5 text-amber-400" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-blue-500" />
        )}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-[360px] bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-xl p-6 relative overflow-hidden z-10">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
        
        {/* Header with theme-responsive Logo image */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center">
            <img
              src={logoSrc}
              alt="WA-NJAY Logo"
              className="h-56 w-56 max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Kode Akses (Access Code)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                <Key className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                required
                placeholder="Masukkan Kode Akses Anda"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors uppercase font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm active:scale-98"
          >
            {loading ? 'Logging in...' : 'Masuk Dashboard'}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="text-[9px] text-center text-gray-400 dark:text-zinc-500 mt-5 leading-normal">
          Silakan masukkan kode akses yang diberikan oleh administrator untuk masuk.
        </p>
      </div>
    </div>
  );
};
