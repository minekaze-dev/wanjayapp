import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Network,
  ArrowUpRight,
  UserCheck,
  Search,
} from 'lucide-react';
import { Schedule } from '../types';

export const Dashboard: React.FC = () => {
  const { schedules, activities, currentUser, openWhatsApp, setActiveTab } = useApp();
  const [adminTab, setAdminTab] = useState<'upcoming' | 'pending' | 'sent'>('upcoming');
  const [logFilter, setLogFilter] = useState<'all' | 'login' | 'schedule' | 'reply'>('all');
  const [scheduleSearch, setScheduleSearch] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  // Dynamic status calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter((s) => s.date === todayStr);
  const pendingCount = schedules.filter((s) => s.status === 'Pending').length;
  const sentCount = schedules.filter((s) => s.status === 'Sent').length;
  const needReplyCount = schedules.filter((s) => s.status === 'Need Reply').length;
  const failedCount = schedules.filter((s) => s.status === 'Failed').length;

  // Filter pending/upcoming schedules for the list (max 5) - Sales Only
  const upcomingSchedules = [...schedules]
    .filter((s) => s.status === 'Pending' || s.status === 'Sending')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  // Admin Schedules filters
  const adminUpcoming = [...schedules]
    .filter((s) => s.status === 'Pending' || s.status === 'Sending')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const adminPending = schedules.filter((s) => s.status === 'Pending');
  const adminSent = schedules.filter((s) => s.status === 'Sent');

  // Select active list for Admin
  const getAdminScheduleList = () => {
    switch (adminTab) {
      case 'pending':
        return adminPending;
      case 'sent':
        return adminSent;
      case 'upcoming':
      default:
        return adminUpcoming;
    }
  };

  const currentAdminListUnfiltered = getAdminScheduleList();
  const currentAdminList = currentAdminListUnfiltered.filter((s) =>
    s.customerName.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
    s.whatsappNumber.includes(scheduleSearch) ||
    s.salesName.toLowerCase().includes(scheduleSearch.toLowerCase())
  );

  // Filtered logs for Admin/Sales
  const filteredActivities = activities.filter((act) => {
    if (!isAdmin) return true; // Sales see all
    if (logFilter === 'all') return true;
    if (logFilter === 'login') return act.type === 'connected';
    if (logFilter === 'schedule') return act.type === 'schedule_created';
    if (logFilter === 'reply') return act.type === 'reply';
    return true;
  });

  // Status badge helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'Need Reply':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 font-semibold animate-pulse';
      case 'Sent':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <div id="dashboard-view" className="p-4 space-y-4 overflow-y-auto flex-1">
      {/* 6 Grid Stats Cards (Compact layout) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Today's Job</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{todaySchedules.length}</h3>
          </div>
          <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-500 rounded">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Pending</p>
            <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingCount}</h3>
          </div>
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        {/* Sent */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Sent</p>
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{sentCount}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>

        {/* Need Reply */}
        <button
          onClick={() => setActiveTab('inbox')}
          className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between text-left cursor-pointer hover:border-emerald-500/55 transition-colors"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Need Reply</p>
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{needReplyCount}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded relative">
            {needReplyCount > 0 && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full" />}
            <MessageSquare className="h-4 w-4" />
          </div>
        </button>

        {/* Failed */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Failed</p>
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{failedCount}</h3>
          </div>
          <div className="p-1.5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>

        {/* WhatsApp Status */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">WhatsApp</p>
            <h3 className={`text-xs font-bold ${currentUser?.whatsappStatus === 'connected' ? 'text-emerald-600' : 'text-red-500'}`}>
              {currentUser?.whatsappStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
            </h3>
          </div>
          <div className={`p-1.5 rounded ${currentUser?.whatsappStatus === 'connected' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30' : 'bg-red-50 text-red-500 dark:bg-red-950/30'}`}>
            <Network className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Split Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column (Main Board Schedules) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg p-4 flex flex-col shadow-sm">
          {isAdmin ? (
            /* ADMIN LAYOUT: Monitoring all users schedules, closest ones and pending/sent status lists */
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    Monitoring Schedule Sales
                  </h4>
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500">Pantau seluruh antrean terdekat, status pending, dan pengiriman semua sales</p>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer self-start"
                >
                  Manage All
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              {/* Tabs and Search */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="flex gap-1 bg-gray-50 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-150 dark:border-zinc-700/80 shrink-0">
                  <button
                    onClick={() => setAdminTab('upcoming')}
                    className={`py-1 px-2.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      adminTab === 'upcoming'
                        ? 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 shadow-xs border border-gray-150 dark:border-zinc-700'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Terdekat ({adminUpcoming.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('pending')}
                    className={`py-1 px-2.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      adminTab === 'pending'
                        ? 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 shadow-xs border border-gray-150 dark:border-zinc-700'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Pending ({adminPending.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('sent')}
                    className={`py-1 px-2.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      adminTab === 'sent'
                        ? 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 shadow-xs border border-gray-150 dark:border-zinc-700'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Sent ({adminSent.length})
                  </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                    <Search className="h-3 w-3" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari customer / sales..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-[10px] bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedules List for Admin */}
              <div className="space-y-1.5 overflow-y-auto max-h-[300px] flex-1">
                {currentAdminList.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Tidak ada schedule dalam kategori ini.</p>
                  </div>
                ) : (
                  currentAdminList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded border border-gray-50 dark:border-zinc-800/60 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-center shrink-0">
                          <span className="block text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase leading-none">
                            {item.date === todayStr ? 'Hari Ini' : item.date.split('-').slice(1).join('/')}
                          </span>
                          <span className="inline-block text-[10px] font-mono font-bold text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded mt-1">
                            {item.time}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <h5 className="text-[11px] font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{item.customerName}</span>
                            <span className="text-[8px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/30 px-1 rounded-sm shrink-0 font-medium">
                              Sales: {item.salesName}
                            </span>
                          </h5>
                          <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 font-mono truncate">
                            {item.whatsappNumber} • "{item.message}"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* SALES LAYOUT: Standard Upcoming Queue */
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  Upcoming Queue
                </h4>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                >
                  Manage Schedules
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[300px] flex-1">
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">No upcoming schedules. Generate some schedules!</p>
                  </div>
                ) : (
                  upcomingSchedules.map((item) => (
                    <div
                      key={item.id}
                      id={`upcoming-item-${item.id}`}
                      className="flex items-center justify-between p-2 rounded border border-gray-50 dark:border-zinc-800/60 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {item.time}
                        </span>
                        <div>
                          <h5 className="text-[11px] font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <span>{item.customerName}</span>
                            {(() => {
                              const fuCount = schedules.filter(s => s.whatsappNumber === item.whatsappNumber).length;
                              return fuCount > 0 && (
                                <span className="text-black dark:text-white font-bold tracking-widest text-[10px]" title={`${fuCount} Follow Ups`}>
                                  {'●'.repeat(fuCount)}
                                </span>
                              );
                            })()}
                          </h5>
                          <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 font-mono">
                            {item.whatsappNumber} • Sales: {item.salesName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                        {item.status === 'Need Reply' && (
                          <button
                            onClick={() => openWhatsApp(item.whatsappNumber, item.customerName)}
                            className="py-0.5 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-semibold rounded transition-colors cursor-pointer"
                          >
                            WA
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity (Col span 2) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col shadow-sm">
          <div className="mb-3 pb-2 border-b border-zinc-800 flex items-center justify-between">
            <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-emerald-500">➜</span> LOG_SYSTEM_ACTIVITY
            </h4>
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500/50"></div>
              <div className="h-2 w-2 rounded-full bg-amber-500/50"></div>
              <div className="h-2 w-2 rounded-full bg-emerald-500/50"></div>
            </div>
          </div>

          {/* Filter Chips for Logs (Admin only) */}
          {isAdmin && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {(['all', 'login', 'schedule', 'reply'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setLogFilter(filterType)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    logFilter === filterType
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {filterType === 'all' && 'SEMUA'}
                  {filterType === 'login' && 'LOGIN'}
                  {filterType === 'schedule' && 'SCHEDULE'}
                  {filterType === 'reply' && 'REPLY'}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 flex-1 font-mono text-[10px]">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-655">No logs found.</p>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const getActColor = (type: string) => {
                  switch (type) {
                    case 'reply':
                      return 'text-blue-400';
                    case 'schedule_created':
                      return 'text-amber-400';
                    case 'connected':
                      return 'text-emerald-400';
                    default:
                      return 'text-zinc-400';
                  }
                };

                return (
                  <div key={act.id} className="border-l border-zinc-800 pl-2 pb-2">
                    <div className="flex gap-2 items-start">
                      <span className={`shrink-0 ${getActColor(act.type)}`}>[{act.type.toUpperCase()}]</span>
                      <p className="text-zinc-200 leading-normal">
                        {act.content}
                      </p>
                    </div>
                    <span className="text-zinc-600 block pl-[calc(1ch+0.5rem+4ch)]">
                      {act.timestamp}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
