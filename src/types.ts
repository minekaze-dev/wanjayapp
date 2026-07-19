export type RoleType = 'Admin' | 'Sales';
export type WhatsAppStatusType = 'connected' | 'reconnecting' | 'disconnected';
export type ScheduleStatusType = 'Pending' | 'Sending' | 'Sent' | 'Need Reply' | 'Failed';
export type RepeatType = 'Tidak' | 'Harian' | 'Mingguan' | 'Bulanan';
export type DelayType = '30-60 detik' | '60-120 detik' | '2-5 menit';
export type IntervalType = '2-3 menit' | '3-5 menit' | '5-8 menit' | '10-15 menit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  accessCode: string;
  whatsappStatus: WhatsAppStatusType;
  lastActive: string;
  disabled?: boolean;
}

export interface Schedule {
  id: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  customerName: string;
  whatsappNumber: string;
  salesName: string;
  salesId: string;
  status: ScheduleStatusType;
  message: string;
  imageUrl?: string;
  templateId?: string;
  repeat: RepeatType;
  delay: DelayType;
  followUpDay?: number; // 1, 2, 4, 7
  stopIfReplied?: boolean;
}

export interface InboxItem {
  id: string;
  customerName: string;
  whatsappNumber: string;
  lastMessage: string;
  timeAgo: string;
  timestamp: Date;
  unread: boolean;
}

export interface Activity {
  id: string;
  type: 'reply' | 'schedule_created' | 'connected' | 'system';
  content: string;
  timestamp: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}
