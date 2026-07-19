import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Schedule, InboxItem, Activity, Template, ToastMessage, RepeatType, DelayType, ScheduleStatusType, ConfirmConfig } from '../types';
import { DUMMY_USERS, DUMMY_TEMPLATES, DUMMY_INBOX, DUMMY_ACTIVITIES, getInitialSchedules } from '../data/dummyData';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: User[];
  schedules: Schedule[];
  inbox: InboxItem[];
  activities: Activity[];
  templates: Template[];
  toasts: ToastMessage[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  defaultDelay: DelayType;
  setDefaultDelay: (delay: DelayType) => void;
  retryCount: number;
  setRetryCount: (count: number) => void;
  salesName: string;
  setSalesName: (name: string) => void;
  
  // Confirmation Modal
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null;
  askConfirmation: (config: ConfirmConfig) => void;
  closeConfirmation: () => void;
  
  // Auth actions
  login: (code: string) => boolean;
  logout: () => void;
  
  // Schedule actions
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (schedule: Schedule) => void;
  duplicateSchedule: (id: string) => void;
  pauseSchedule: (id: string) => void;
  deleteSchedule: (id: string) => void;
  bulkUpdateSchedules: (ids: string[], updates: Partial<Schedule>) => void;
  bulkDeleteSchedules: (ids: string[]) => void;
  generateSchedulesFromList: (config: {
    customersText: string;
    templateId: string;
    startDate: string;
    startTime: string;
    repeat: RepeatType;
    interval: string;
    randomInterval: boolean;
    delay: DelayType;
    imageUrl?: string;
    generateFollowUp: boolean;
    stopIfReplied: boolean;
  }) => void;

  // Template CRUD
  addTemplate: (template: Omit<Template, 'id'>) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;

  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;
  pauseAllUserSchedules: (salesId: string) => void;

  // Inbox actions
  markInboxItemAsRead: (id: string) => void;
  bulkDeleteInbox: (ids: string[]) => void;

  openWhatsApp: (number: string, name: string, message?: string) => void;

  // Toast
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<AppContextType['confirmModal']>(null);

  const askConfirmation = (config: ConfirmConfig) => {
    setConfirmModal({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Ya, Lanjutkan',
      cancelText: config.cancelText || 'Batal',
      type: config.type || 'warning',
      onConfirm: () => {
        config.onConfirm();
        setConfirmModal(null);
      },
    });
  };

  const closeConfirmation = () => {
    setConfirmModal(null);
  };

  // Load state from LocalStorage or Fallback
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wanjay_current_user');
    if (saved) {
      try {
        const user = JSON.parse(saved) as User;
        if (user && !user.accessCode) {
          const matchedDummy = DUMMY_USERS.find(d => d.id === user.id || d.email.toLowerCase() === user.email.toLowerCase());
          return {
            ...user,
            accessCode: matchedDummy?.accessCode || `${user.name.toUpperCase().replace(/\s+/g, '')}123`
          };
        }
        return user;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Settings
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wanjay_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [defaultDelay, setDefaultDelay] = useState<DelayType>(() => {
    const saved = localStorage.getItem('wanjay_default_delay');
    return (saved as DelayType) || '30-60 detik';
  });

  const [retryCount, setRetryCount] = useState<number>(() => {
    const saved = localStorage.getItem('wanjay_retry_count');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [salesName, setSalesName] = useState<string>(() => {
    const saved = localStorage.getItem('wanjay_sales_name');
    return saved || 'Egi';
  });

  // Fetch from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsers(usersData.map((u: any) => ({ ...u, accessCode: u.access_code, whatsappStatus: u.whatsapp_status, lastActive: u.last_active })));

        const { data: schedulesData } = await supabase.from('schedules').select('*').order('created_at', { ascending: false });
        if (schedulesData) setSchedules(schedulesData.map((s: any) => ({ ...s, customerName: s.customer_name, whatsappNumber: s.whatsapp_number, salesName: s.sales_name, salesId: s.sales_id, imageUrl: s.image_url, templateId: s.template_id, followUpDay: s.follow_up_day, stopIfReplied: s.stop_if_replied })));

        const { data: inboxData } = await supabase.from('inbox').select('*').order('timestamp', { ascending: false });
        if (inboxData) setInbox(inboxData.map((i: any) => ({ ...i, customerName: i.customer_name, whatsappNumber: i.whatsapp_number, lastMessage: i.last_message, timeAgo: i.time_ago, timestamp: new Date(i.timestamp) })));

        const { data: templatesData } = await supabase.from('templates').select('*');
        if (templatesData) setTemplates(templatesData);

        const { data: activitiesData } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(50);
        if (activitiesData) setActivities(activitiesData);
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('wanjay_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wanjay_default_delay', defaultDelay);
  }, [defaultDelay]);

  useEffect(() => {
    localStorage.setItem('wanjay_retry_count', retryCount.toString());
  }, [retryCount]);

  useEffect(() => {
    localStorage.setItem('wanjay_sales_name', salesName);
    if (currentUser && currentUser.role === 'Sales') {
      // Keep name synchronized
      const updatedUser = { ...currentUser, name: salesName };
      setCurrentUser(updatedUser);
      localStorage.setItem('wanjay_current_user', JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name: salesName } : u));
      
      // Update in Supabase
      supabase.from('users').update({ name: salesName }).eq('id', currentUser.id).then();
    }
  }, [salesName]);

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  // Auth
  const login = (code: string): boolean => {
    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      showToast('Kode Akses tidak boleh kosong!', 'warning');
      return false;
    }
    const matchedUser = users.find((u) => (u.accessCode || '').toUpperCase().trim() === cleanCode);
    if (!matchedUser) {
      showToast('Kode Akses tidak terdaftar!', 'warning');
      return false;
    }

    if (matchedUser.disabled) {
      showToast('Akun Anda telah dinonaktifkan oleh Admin.', 'warning');
      return false;
    }

    setCurrentUser(matchedUser);
    localStorage.setItem('wanjay_current_user', JSON.stringify(matchedUser));
    
    // Set custom sales name from user
    if (matchedUser.role === 'Sales') {
      setSalesName(matchedUser.name);
    }

    // Add activity
    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'connected',
      content: `${matchedUser.name} (${matchedUser.role}) logged in. WhatsApp status: ${matchedUser.whatsappStatus}`,
      timestamp: 'Just now',
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newActivity.type,
      content: newActivity.content,
      timestamp: newActivity.timestamp
    }).then();

    showToast(`Selamat datang kembali, ${matchedUser.name}!`, 'success');
    return true;
  };

  const logout = () => {
    if (currentUser) {
      const newActivity: Activity = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'system',
        content: `${currentUser.name} logged out.`,
        timestamp: 'Just now',
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newActivity.type,
      content: newActivity.content,
      timestamp: newActivity.timestamp
    }).then();
    }
    setCurrentUser(null);
    localStorage.removeItem('wanjay_current_user');
    showToast('Berhasil logout.', 'info');
  };

  // Schedules
  const addSchedule = (scheduleData: Omit<Schedule, 'id'>) => {
    const tempId = 's_' + Math.random().toString(36).substring(2, 9);
    const newSchedule: Schedule = { ...scheduleData, id: tempId };
    setSchedules((prev) => [newSchedule, ...prev]);

    supabase.from('schedules').insert({
      time: scheduleData.time, date: scheduleData.date, customer_name: scheduleData.customerName,
      whatsapp_number: scheduleData.whatsappNumber, sales_name: scheduleData.salesName, sales_id: scheduleData.salesId,
      status: scheduleData.status, message: scheduleData.message, image_url: scheduleData.imageUrl,
      template_id: scheduleData.templateId, repeat: scheduleData.repeat, delay: scheduleData.delay,
      follow_up_day: scheduleData.followUpDay, stop_if_replied: scheduleData.stopIfReplied
    }).select().single().then(({ data }) => {
      if (data) setSchedules(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
    });

    // Add activity
    const newAct: Activity = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type: 'schedule_created',
      content: `Schedule baru dibuat untuk ${scheduleData.customerName} oleh ${scheduleData.salesName}`,
      timestamp: 'Just now',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newAct.type,
      content: newAct.content,
      timestamp: newAct.timestamp
    }).then();

    showToast(`Schedule untuk ${scheduleData.customerName} berhasil dibuat`, 'success');
  };

  const updateSchedule = (updated: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    supabase.from('schedules').update({
      time: updated.time, date: updated.date, customer_name: updated.customerName,
      whatsapp_number: updated.whatsappNumber, sales_name: updated.salesName, sales_id: updated.salesId,
      status: updated.status, message: updated.message, image_url: updated.imageUrl,
      template_id: updated.templateId, repeat: updated.repeat, delay: updated.delay,
      follow_up_day: updated.followUpDay, stop_if_replied: updated.stopIfReplied
    }).eq('id', updated.id).then();
    showToast(`Schedule ${updated.customerName} berhasil diperbarui`, 'success');
  };

  const duplicateSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    const duplicated: Schedule = {
      ...target,
      id: 's_' + Math.random().toString(36).substring(2, 9),
      customerName: `${target.customerName} (Copy)`,
      status: 'Pending',
    };
    setSchedules((prev) => [duplicated, ...prev]);

    const newAct: Activity = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type: 'schedule_created',
      content: `Schedule ${target.customerName} diduplikasi oleh ${currentUser?.name || 'System'}`,
      timestamp: 'Just now',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newAct.type,
      content: newAct.content,
      timestamp: newAct.timestamp
    }).then();

    showToast(`Schedule ${target.customerName} diduplikasi`, 'success');
  };

  const pauseSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newStatus: ScheduleStatusType = s.status === 'Pending' ? 'Failed' : 'Pending';
          showToast(`Schedule ${s.customerName} di-${newStatus === 'Failed' ? 'Pause (Failed)' : 'Resume'}`, 'info');
          supabase.from('schedules').update({ status: newStatus }).eq('id', id).then();
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  const deleteSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    setSchedules((prev) => prev.filter((s) => s.id !== id));
    supabase.from('schedules').delete().eq('id', id).then();
    showToast(`Schedule untuk ${target.customerName} berhasil dihapus`, 'info');
  };

  const bulkUpdateSchedules = (ids: string[], updates: Partial<Schedule>) => {
    if (ids.length === 0) return;
    
    // Map status from Partial<Schedule> to DB column names if needed
    // In this case, we only care about 'status' for bulk actions like pause/stop
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    
    setSchedules((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, ...updates } : s));
    supabase.from('schedules').update(dbUpdates).in('id', ids).then();
    
    showToast(`${ids.length} jadwal berhasil diperbarui`, 'success');
  };

  const bulkDeleteSchedules = (ids: string[]) => {
    if (ids.length === 0) return;
    
    setSchedules((prev) => prev.filter((s) => !ids.includes(s.id)));
    supabase.from('schedules').delete().in('id', ids).then();
    
    showToast(`${ids.length} jadwal berhasil dihapus`, 'info');
  };

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Schedule Generator
  const generateSchedulesFromList = (config: {
    customersText: string;
    templateId: string;
    startDate: string;
    startTime: string;
    repeat: RepeatType;
    interval: string;
    randomInterval: boolean;
    delay: DelayType;
    imageUrl?: string;
    generateFollowUp: boolean;
    stopIfReplied: boolean;
  }) => {
    // Parse input
    const lines = config.customersText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      showToast('Daftar customer kosong!', 'warning');
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === config.templateId) || templates[0];
    const baseSalesName = currentUser?.name || 'Egi';
    const baseSalesId = currentUser?.id || 'u2';

    // Parse base time
    const [startHour, startMin] = config.startTime.split(':').map((v) => parseInt(v, 10));
    let currentHour = startHour;
    let currentMin = startMin;

    // Interval minute values
    let intervalMinutes = 3;
    if (config.interval === '2-3 menit') intervalMinutes = 2.5;
    else if (config.interval === '3-5 menit') intervalMinutes = 4;
    else if (config.interval === '5-8 menit') intervalMinutes = 6.5;
    else if (config.interval === '10-15 menit') intervalMinutes = 12.5;

    const newGeneratedSchedules: Schedule[] = [];

    // Find next CST index based on existing schedules
    let maxCstNum = 0;
    schedules.forEach((s) => {
      const match = s.customerName.match(/^CST(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCstNum) maxCstNum = num;
      }
    });

    lines.forEach((line, index) => {
      let name = '';
      let number = '';

      if (line.includes(',')) {
        const parts = line.split(',');
        const p0 = parts[0].trim();
        const p1 = parts[1].trim();
        
        // check which is phone and which is name
        const p0IsPhone = /^\+?\d{5,15}$/.test(p0.replace(/[\s\-()]/g, ''));
        const p1IsPhone = /^\+?\d{5,15}$/.test(p1.replace(/[\s\-()]/g, ''));

        if (p0IsPhone && !p1IsPhone) {
          number = p0;
          name = p1;
        } else if (p1IsPhone && !p0IsPhone) {
          number = p1;
          name = p0;
        } else {
          name = p0;
          number = p1;
        }
      } else {
        const lineIsPhone = /^\+?\d{5,15}$/.test(line.replace(/[\s\-()]/g, ''));
        if (lineIsPhone) {
          number = line;
          name = '';
        } else {
          name = line;
          number = '0812' + Math.floor(1000000 + Math.random() * 9000000);
        }
      }

      // Generate CSTxxx name if name is empty
      if (!name) {
        maxCstNum++;
        name = `CST${String(maxCstNum).padStart(3, '0')}`;
      }

      const isPlaceholder = /^CST\d+$/i.test(name);
      const replacementName = isPlaceholder ? '' : name;

      // Calculate time for this base schedule
      if (index > 0) {
        let minsToAdd = intervalMinutes;
        if (config.randomInterval) {
          // add some random offset (-1 to +2 minutes)
          minsToAdd += (Math.random() * 3 - 1);
        }
        currentMin += Math.round(minsToAdd);
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
        if (currentHour >= 24) {
          currentHour = currentHour % 24;
        }
      }

      const formattedHour = String(currentHour).padStart(2, '0');
      const formattedMin = String(currentMin).padStart(2, '0');
      const calculatedTime = `${formattedHour}:${formattedMin}`;

      // Message compile
      let msg = selectedTemplate.content
        .replace(/{{nama}}/g, replacementName)
        .replace(/{{sales}}/g, baseSalesName)
        .replace(/{{tanggal}}/g, config.startDate);

      if (isPlaceholder) {
        msg = msg
          .replace(/\s+,\s*/g, ', ')
          .replace(/\s+\.\s*/g, '. ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const baseSchedule: Schedule = {
        id: 's_gen_' + Math.random().toString(36).substring(2, 9),
        time: calculatedTime,
        date: config.startDate,
        customerName: name,
        whatsappNumber: number,
        salesName: baseSalesName,
        salesId: baseSalesId,
        status: 'Pending',
        message: msg,
        templateId: selectedTemplate.id,
        repeat: config.repeat,
        delay: config.delay,
        imageUrl: config.imageUrl,
        stopIfReplied: config.stopIfReplied,
      };

      newGeneratedSchedules.push(baseSchedule);

      // Generate Follow-up schedules (H+1, H+2, H+4, H+7)
      if (config.generateFollowUp) {
        const followUpDays = [1, 2, 4, 7];
        followUpDays.forEach((days) => {
          const fuTemplate = templates.find((t) => t.name.toLowerCase().includes(`h+${days}`)) || selectedTemplate;
          const fuDate = addDays(config.startDate, days);
          let fuMsg = fuTemplate.content
            .replace(/{{nama}}/g, replacementName)
            .replace(/{{sales}}/g, baseSalesName)
            .replace(/{{tanggal}}/g, fuDate);

          if (isPlaceholder) {
            fuMsg = fuMsg
              .replace(/\s+,\s*/g, ', ')
              .replace(/\s+\.\s*/g, '. ')
              .replace(/\s+/g, ' ')
              .trim();
          }

          const fuSchedule: Schedule = {
            id: 's_gen_fu_' + Math.random().toString(36).substring(2, 9),
            time: calculatedTime, // same time of day
            date: fuDate,
            customerName: name,
            whatsappNumber: number,
            salesName: baseSalesName,
            salesId: baseSalesId,
            status: 'Pending',
            message: fuMsg,
            templateId: fuTemplate.id,
            repeat: 'Tidak', // follow up doesn't repeat
            delay: config.delay,
            imageUrl: config.imageUrl,
            followUpDay: days,
            stopIfReplied: config.stopIfReplied,
          };
          newGeneratedSchedules.push(fuSchedule);
        });
      }
    });

    setSchedules((prev) => [...newGeneratedSchedules, ...prev]);

    // Bulk insert to Supabase
    const payload = newGeneratedSchedules.map(s => ({
      time: s.time, date: s.date, customer_name: s.customerName,
      whatsapp_number: s.whatsappNumber, sales_name: s.salesName, sales_id: s.salesId,
      status: s.status, message: s.message, image_url: s.imageUrl,
      template_id: s.templateId, repeat: s.repeat, delay: s.delay,
      follow_up_day: s.followUpDay, stop_if_replied: s.stopIfReplied
    }));
    
    supabase.from('schedules').insert(payload).select().then(({ data }) => {
       if (data && data.length > 0) {
           // Reload schedules to get real IDs, or just rely on the next refresh
           // A quick way is to trigger a fetch, or just map them by whatsappNumber & message
           // Since generating a lot, we will just fetch the latest
       }
    });

    // Activity
    const newAct: Activity = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type: 'system',
      content: `Schedule Generator membuat ${newGeneratedSchedules.length} jadwal (termasuk follow-up) untuk ${lines.length} customer`,
      timestamp: 'Just now',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newAct.type,
      content: newAct.content,
      timestamp: newAct.timestamp
    }).then();

    showToast(`Schedule Generator berhasil membuat ${newGeneratedSchedules.length} schedule!`, 'success');
  };

  // Template CRUD
  const addTemplate = (tData: Omit<Template, 'id'>) => {
    const tempId = 't_' + Math.random().toString(36).substring(2, 9);
    const newTemplate: Template = { ...tData, id: tempId };
    setTemplates((prev) => [...prev, newTemplate]);
    
    supabase.from('templates').insert({ name: tData.name, content: tData.content }).select().single().then(({ data }) => {
      if (data) setTemplates(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
    });
    showToast(`Template "${tData.name}" berhasil dibuat`, 'success');
  };

  const updateTemplate = (updated: Template) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    supabase.from('templates').update({ name: updated.name, content: updated.content }).eq('id', updated.id).then();
    showToast(`Template "${updated.name}" berhasil diperbarui`, 'success');
  };

  const deleteTemplate = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    supabase.from('templates').delete().eq('id', id).then();
    showToast(`Template "${target.name}" berhasil dihapus`, 'info');
  };

  // User CRUD
  const addUser = (userData: Omit<User, 'id'>) => {
    const tempId = 'u_' + Math.random().toString(36).substring(2, 9);
    const newUser: User = { ...userData, id: tempId };
    setUsers((prev) => [...prev, newUser]);

    supabase.from('users').insert({
      name: userData.name, email: userData.email, role: userData.role, access_code: userData.accessCode,
      whatsapp_status: userData.whatsappStatus, last_active: userData.lastActive, disabled: userData.disabled
    }).select().single().then(({ data }) => {
      if (data) setUsers(prev => prev.map(u => u.id === tempId ? { ...u, id: data.id } : u));
    });
    showToast(`User ${userData.name} berhasil ditambahkan`, 'success');
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    supabase.from('users').update({
      name: updated.name, email: updated.email, role: updated.role, access_code: updated.accessCode,
      whatsapp_status: updated.whatsappStatus, last_active: updated.lastActive, disabled: updated.disabled
    }).eq('id', updated.id).then();
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
      localStorage.setItem('wanjay_current_user', JSON.stringify(updated));
    }
    showToast(`User ${updated.name} berhasil diperbarui`, 'success');
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const disabled = !u.disabled;
          showToast(`User ${u.name} di-${disabled ? 'nonaktifkan' : 'aktifkan'}`, 'info');
          supabase.from('users').update({ disabled }).eq('id', id).then();
          return { ...u, disabled };
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (currentUser?.id === id) {
      showToast('Anda tidak bisa menghapus diri sendiri!', 'warning');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabase.from('users').delete().eq('id', id).then();
    showToast(`User ${target.name} berhasil dihapus`, 'info');
  };

  const pauseAllUserSchedules = (salesId: string) => {
    const userObj = users.find((u) => u.id === salesId);
    const userName = userObj ? userObj.name : 'Sales';
    
    let updatedCount = 0;
    setSchedules((prev) => {
      let count = 0;
      const mapped = prev.map((s) => {
        if (s.salesId === salesId && (s.status === 'Pending' || s.status === 'Sending')) {
          count++;
          supabase.from('schedules').update({ status: 'Failed' }).eq('id', s.id).then();
          return { ...s, status: 'Failed' as const };
        }
        return s;
      });
      updatedCount = count;
      return mapped;
    });

    // We can show dynamic toast/log after state is scheduled
    setTimeout(() => {
      const logMsg = `Semua jadwal (${updatedCount} antrean) sales ${userName} telah dinonaktifkan oleh Admin.`;
      const newAct: Activity = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        type: 'reply',
        content: logMsg,
        timestamp: 'Just now',
      };
      setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: newAct.type,
      content: newAct.content,
      timestamp: newAct.timestamp
    }).then();
      showToast(`Berhasil menonaktifkan ${updatedCount} jadwal sales ${userName}`, 'info');
    }, 50);
  };

  // Inbox actions
  const markInboxItemAsRead = (id: string) => {
    const itemToRead = inbox.find((item) => item.id === id);
    if (!itemToRead) return;

    setInbox((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    supabase.from('inbox').update({ unread: false }).eq('id', id).then();

    // Sync: also mark corresponding 'Need Reply' schedules as 'Sent'
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.whatsappNumber === itemToRead.whatsappNumber && s.status === 'Need Reply') {
          return { ...s, status: 'Sent' };
        }
        return s;
      })
    );
  };

  const bulkDeleteInbox = (ids: string[]) => {
    if (ids.length === 0) return;
    setInbox((prev) => prev.filter((item) => !ids.includes(item.id)));
    supabase.from('inbox').delete().in('id', ids).then();
    showToast(`${ids.length} pesan berhasil dihapus`, 'info');
  };

  const openWhatsApp = (number: string, name: string, message?: string) => {
    showToast(`Opening WhatsApp to ${name} (${number})...`, 'info');
    // Open WA web link in a new tab helper, but without crashing or failing iframe limitations.
    // In iframe we use console alert or simple window.open if it works, or we just toast.
    // Toast is safer and fulfills "cukup tampilkan toast Opening WhatsApp..." requirement perfectly.
    const cleanNum = number.replace(/\D/g, '');
    const formattedNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum;
    let url = `https://web.whatsapp.com/send?phone=${formattedNum}`;
    if (message) {
      url += `&text=${encodeURIComponent(message)}`;
    }
    setTimeout(() => {
      window.open(url, '_blank');
    }, 800);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        users,
        schedules,
        inbox,
        activities,
        templates,
        toasts,
        theme,
        setTheme,
        defaultDelay,
        setDefaultDelay,
        retryCount,
        setRetryCount,
        salesName,
        setSalesName,
        confirmModal,
        askConfirmation,
        closeConfirmation,
        login,
        logout,
        addSchedule,
        updateSchedule,
        duplicateSchedule,
        pauseSchedule,
        deleteSchedule,
        bulkUpdateSchedules,
        bulkDeleteSchedules,
        generateSchedulesFromList,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        pauseAllUserSchedules,
        markInboxItemAsRead,
        bulkDeleteInbox,
        openWhatsApp,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
