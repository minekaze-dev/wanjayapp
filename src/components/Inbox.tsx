import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, MessageSquare, ExternalLink, MessageCircle, Inbox as InboxIcon, ArrowLeft } from 'lucide-react';
import { InboxItem } from '../types';

export const Inbox: React.FC = () => {
  const { inbox, schedules, currentUser, openWhatsApp, showToast, markInboxItemAsRead } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSalesFilter, setSelectedSalesFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  // Filter based on user role (Sales can only see their own, Admin can see all)
  const userInbox = currentUser?.role === 'Admin'
    ? inbox
    : inbox.filter((item) =>
        schedules.some((s) => s.whatsappNumber === item.whatsappNumber && s.salesId === currentUser?.id)
      );

  // Filter based on search & sales selection
  const filteredInbox = userInbox.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.whatsappNumber.includes(search) ||
      item.lastMessage.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (currentUser?.role === 'Admin' && selectedSalesFilter !== 'all') {
      const hasMatchingSchedule = schedules.some(
        (s) => s.whatsappNumber === item.whatsappNumber && s.salesName === selectedSalesFilter
      );
      return hasMatchingSchedule;
    }

    return true;
  });

  const handleOpenWA = (item: InboxItem) => {
    markInboxItemAsRead(item.id);
    openWhatsApp(item.whatsappNumber, item.customerName);
  };

  const handleSelectConversation = (item: InboxItem) => {
    markInboxItemAsRead(item.id);
    setSelectedItem(item);
  };

  return (
    <div id="inbox-view" className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
      {/* Conversations list sidebar */}
      <div className={`w-full md:w-80 shrink-0 border-r border-gray-150 dark:border-zinc-800 flex flex-col overflow-hidden ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
        {/* Search & Filter Header */}
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {currentUser?.role === 'Admin' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold shrink-0">Filter Sales:</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="w-full text-[10px] bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-1.5 py-1 text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Sales</option>
                {Array.from(new Set(schedules.map((s) => s.salesName))).filter(Boolean).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800/60">
          {filteredInbox.length === 0 ? (
            <div className="text-center py-12 px-4">
              <InboxIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Tidak ada chat balasan.</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">Chat balasan dari customer akan otomatis muncul di sini saat terdeteksi oleh sistem.</p>
            </div>
          ) : (
            filteredInbox.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const fuCount = schedules.filter(s => s.whatsappNumber === item.whatsappNumber).length;
              return (
                <button
                  key={item.id}
                  id={`inbox-item-${item.id}`}
                  onClick={() => handleSelectConversation(item)}
                  className={`w-full text-left p-3 flex gap-2.5 hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors relative cursor-pointer ${
                    isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {/* Unread dot */}
                  {item.unread && (
                    <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}

                  {/* Profile circle icon */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.unread
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/30'
                      : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {item.customerName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs truncate flex items-center gap-1.5 ${item.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-zinc-200'}`}>
                        <span className="truncate">{item.customerName}</span>
                        {fuCount > 0 && (
                          <span className="text-black dark:text-white font-bold tracking-widest text-[11px] shrink-0" title={`${fuCount} Follow Ups`}>
                            {'●'.repeat(fuCount)}
                          </span>
                        )}
                      </h4>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono font-medium">{item.timeAgo}</span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${item.unread ? 'text-gray-800 dark:text-zinc-100 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                      {item.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono">
                        {item.whatsappNumber}
                      </span>
                      {currentUser?.role === 'Admin' && (
                        <span className="text-[9px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                          Sales: {schedules.find((s) => s.whatsappNumber === item.whatsappNumber)?.salesName || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message view detail pane */}
      <div className={`flex-1 flex flex-col bg-gray-50/40 dark:bg-zinc-900/10 overflow-hidden ${selectedItem ? 'flex' : 'hidden md:flex'}`}>
        {selectedItem ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header detail */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 mr-1 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 md:hidden cursor-pointer shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
                  {selectedItem.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 truncate">
                    <span className="truncate">{selectedItem.customerName}</span>
                    {(() => {
                      const activeFuCount = schedules.filter(s => s.whatsappNumber === selectedItem.whatsappNumber).length;
                      return activeFuCount > 0 && (
                        <span className="text-black dark:text-white font-bold tracking-widest text-[11px] shrink-0" title={`${activeFuCount} Follow Ups`}>
                          {'●'.repeat(activeFuCount)}
                        </span>
                      );
                    })()}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 font-mono truncate">
                    {selectedItem.whatsappNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenWA(selectedItem)}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Buka WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </button>
            </div>

            {/* Bubble Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col justify-end bg-gray-50/20 dark:bg-zinc-950/20">
              {/* Simulated Sent Message (Follow Up) */}
              <div className="flex flex-col items-end self-end max-w-[85%]">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl rounded-tr-none shadow-xs text-xs text-emerald-900 dark:text-emerald-200">
                  <p className="leading-relaxed">
                    Halo Kak {selectedItem.customerName}, kami dari WA-NJAY. Apakah ada yang bisa kami bantu terkait layanan follow-up kami?
                  </p>
                </div>
                <span className="text-[8px] font-mono font-medium text-gray-400 dark:text-zinc-500 mt-1 pr-1">
                  Sent • 10 mins ago
                </span>
              </div>

              {/* Customer Received Message (Reply) */}
              <div className="flex flex-col items-start self-start max-w-[85%]">
                <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-2xl rounded-tl-none shadow-xs text-xs text-gray-800 dark:text-zinc-200">
                  <p className="leading-relaxed font-medium">
                    "{selectedItem.lastMessage}"
                  </p>
                </div>
                <span className="text-[8px] font-mono font-medium text-gray-400 dark:text-zinc-500 mt-1 pl-1">
                  Received • {selectedItem.timeAgo}
                </span>
              </div>
            </div>

            {/* Reply Guidance Info Bar */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800/80 text-center text-[10px] text-gray-400 dark:text-zinc-500 shrink-0 font-medium">
              💡 Balas langsung via WhatsApp Web dengan menekan tombol <strong>"Buka WhatsApp"</strong> di kanan atas.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-zinc-800 mb-2" />
            <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider">
              Detail Percakapan
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 max-w-xs mt-1">
              Pilih salah satu percakapan di sebelah kiri untuk melihat pesan masuk dan membuka chat langsung di WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
