import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Calendar,
  Sparkles,
  Plus,
  Edit2,
  Copy,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { NewScheduleModal } from './NewScheduleModal';
import { ScheduleGeneratorModal } from './ScheduleGeneratorModal';
import { Schedule as ScheduleType, ScheduleStatusType } from '../types';

export const Schedule: React.FC = () => {
  const { schedules, deleteSchedule, duplicateSchedule, pauseSchedule, openWhatsApp, askConfirmation } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'pending' | 'need_reply' | 'failed'>('all');

  // Modals state
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const isWithinThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End of week (7 days from today)
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= today && d <= endOfWeek;
  };

  // Filter & Search Logic
  const filteredSchedules = schedules.filter((s) => {
    // Search match
    const query = search.toLowerCase();
    const matchesSearch =
      s.customerName.toLowerCase().includes(query) ||
      s.whatsappNumber.includes(query) ||
      s.salesName.toLowerCase().includes(query) ||
      s.message.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Filter match
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();

    switch (filter) {
      case 'today':
        return s.date === today;
      case 'tomorrow':
        return s.date === tomorrow;
      case 'week':
        return isWithinThisWeek(s.date);
      case 'pending':
        return s.status === 'Pending' || s.status === 'Sending';
      case 'need_reply':
        return s.status === 'Need Reply';
      case 'failed':
        return s.status === 'Failed';
      default:
        return true;
    }
  });

  const getStatusBadgeClass = (status: ScheduleStatusType) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40';
      case 'Sending':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 animate-pulse';
      case 'Sent':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'Need Reply':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400 border border-pink-200/50 dark:border-pink-900/30 font-semibold animate-pulse';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusIcon = (status: ScheduleStatusType) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-3 w-3" />;
      case 'Sending':
        return <Clock className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'Sent':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'Need Reply':
        return <MessageSquare className="h-3 w-3 text-pink-500" />;
      case 'Failed':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
    }
  };

  const handleEditClick = (schedule: ScheduleType) => {
    setEditingSchedule(schedule);
    setIsNewOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    askConfirmation({
      title: 'Hapus Jadwal',
      message: `Apakah Anda yakin ingin menghapus jadwal follow up untuk ${name}?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: () => deleteSchedule(id),
    });
  };

  return (
    <div id="schedule-view" className="p-4 space-y-4 overflow-hidden flex flex-col flex-1">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-xs shrink-0">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari customer, nomor, pesan, sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => {
              setEditingSchedule(null);
              setIsNewOpen(true);
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-bold text-xs rounded-lg transition-all cursor-pointer h-9 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">New Follow Up</span>
          </button>

          <button
            onClick={() => setIsGenOpen(true)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer h-9 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Generator</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'week', label: 'This Week' },
            { id: 'pending', label: 'Pending' },
            { id: 'need_reply', label: 'Need Reply' },
            { id: 'failed', label: 'Failed/Paused' },
          ] as const
        ).map((tag) => {
          const isActive = filter === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => setFilter(tag.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border-gray-150 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      {/* Main Table Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg flex-1 overflow-hidden flex flex-col shadow-xs">
        
        {/* MOBILE VIEW CARDS (md:hidden) */}
        <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 dark:bg-zinc-900/40">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800/60 p-4">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              Belum ada jadwal follow up.
            </div>
          ) : (
            filteredSchedules.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-xl p-3 shadow-xs space-y-2.5 relative"
              >
                {/* Header row: Time & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {item.time}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">
                      {item.date}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Customer Details */}
                <div>
                  <div className="font-bold text-gray-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <span>{item.customerName}</span>
                    {(() => {
                      const fuCount = schedules.filter(s => s.whatsappNumber === item.whatsappNumber).length;
                      return fuCount > 0 && (
                        <span className="text-black dark:text-white font-bold tracking-widest text-[9px]" title={`${fuCount} Follow Ups`}>
                          {'●'.repeat(fuCount)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono font-medium">
                      {item.whatsappNumber}
                    </span>
                    <span className="text-[9px] text-gray-300 dark:text-zinc-700">|</span>
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold px-1 py-0.5 rounded">
                      Sales: {item.salesName}
                    </span>
                    {item.followUpDay && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50/50 dark:bg-emerald-950/10 px-1 rounded">
                        FU H+{item.followUpDay}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message preview */}
                <div className="text-[11px] text-gray-600 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/30 rounded-lg p-2 font-medium break-all">
                  <div className="line-clamp-2">{item.message}</div>
                  {item.imageUrl && (
                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5">
                      <img src={item.imageUrl} alt="preview" className="h-10 w-10 object-cover rounded border border-gray-200 dark:border-zinc-700" />
                    </a>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-gray-100 dark:border-zinc-800/50">
                  <button
                    onClick={() => openWhatsApp(item.whatsappNumber, item.customerName, item.message)}
                    className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    title="Buka Chat WhatsApp"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>

                  {(item.status === 'Pending' || item.status === 'Failed') && (
                    <button
                      onClick={() => pauseSchedule(item.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                      title={item.status === 'Pending' ? 'Pause Schedule' : 'Resume Schedule'}
                    >
                      {item.status === 'Pending' ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    title="Edit Schedule"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => duplicateSchedule(item.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-amber-500 dark:text-amber-400 rounded-lg border border-gray-100 dark:border-zinc-800/80 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    title="Duplikasi Schedule"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(item.id, item.customerName)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg border border-gray-150 dark:border-zinc-800/80 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    title="Hapus Schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP VIEW TABLE (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/30 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-[100px]">Waktu</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Nomor WA</th>
                <th className="py-2.5 px-3">Pesan Preview</th>
                <th className="py-2.5 px-3 w-[80px]">Sales</th>
                <th className="py-2.5 px-3 w-[120px]">Status</th>
                <th className="py-2.5 px-3 w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-xs">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    Belum ada jadwal follow up yang cocok dengan filter / pencarian.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
                  >
                    {/* Time / Date */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-zinc-200 font-mono">
                        {item.time}
                      </div>
                      <div className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 font-mono">
                        {item.date}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{item.customerName}</span>
                        {(() => {
                          const fuCount = schedules.filter(s => s.whatsappNumber === item.whatsappNumber).length;
                          return fuCount > 0 && (
                            <span className="text-black dark:text-white font-bold tracking-widest text-[10px]" title={`${fuCount} Follow Ups`}>
                              {'●'.repeat(fuCount)}
                            </span>
                          );
                        })()}
                      </div>
                      {item.followUpDay && (
                        <span className="inline-flex text-[9px] font-bold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded mt-0.5">
                          FU H+{item.followUpDay}
                        </span>
                      )}
                    </td>

                    {/* WA Number */}
                    <td className="py-2 px-3 font-mono text-[11px] text-gray-600 dark:text-zinc-400">
                      {item.whatsappNumber}
                    </td>

                    {/* Message preview */}
                    <td className="py-2 px-3 max-w-[200px] text-gray-500 dark:text-zinc-400" title={item.message}>
                      <div className="truncate">{item.message}</div>
                      {item.imageUrl && (
                        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1">
                          <img src={item.imageUrl} alt="preview" className="h-10 w-10 object-cover rounded border border-gray-200 dark:border-zinc-700" />
                        </a>
                      )}
                    </td>

                    {/* Sales */}
                    <td className="py-2 px-3 text-gray-600 dark:text-zinc-400">
                      {item.salesName}
                    </td>

                    {/* Status badge */}
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* WA trigger button */}
                        <button
                          onClick={() => openWhatsApp(item.whatsappNumber, item.customerName, item.message)}
                          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded cursor-pointer transition-colors"
                          title="Buka Chat WhatsApp"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>

                        {/* Pause/Resume toggler */}
                        {(item.status === 'Pending' || item.status === 'Failed') && (
                          <button
                            onClick={() => pauseSchedule(item.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded cursor-pointer transition-colors"
                            title={item.status === 'Pending' ? 'Pause Schedule' : 'Resume Schedule'}
                          >
                            {item.status === 'Pending' ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 rounded cursor-pointer transition-colors"
                          title="Edit Schedule"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Duplicate button */}
                        <button
                          onClick={() => duplicateSchedule(item.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-amber-500 dark:text-amber-400 rounded cursor-pointer transition-colors"
                          title="Duplikasi Schedule"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteClick(item.id, item.customerName)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded cursor-pointer transition-colors"
                          title="Hapus Schedule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer / count info */}
        <div className="p-2 border-t border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/30 text-[10px] text-gray-400 dark:text-zinc-500 font-semibold flex justify-between items-center px-4">
          <span>Menampilkan {filteredSchedules.length} dari {schedules.length} total schedules</span>
          <span>Database: Supabase Cloud Terkoneksi</span>
        </div>
      </div>

      {/* Modals injection */}
      <NewScheduleModal
        isOpen={isNewOpen}
        onClose={() => {
          setIsNewOpen(false);
          setEditingSchedule(null);
        }}
        editingSchedule={editingSchedule}
      />

      <ScheduleGeneratorModal
        isOpen={isGenOpen}
        onClose={() => setIsGenOpen(false)}
      />
    </div>
  );
};
