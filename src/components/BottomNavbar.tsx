import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  FileText,
  Users as UsersIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

export const BottomNavbar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, inbox, schedules } = useApp();

  const userInbox = currentUser?.role === 'Admin'
    ? inbox
    : inbox.filter((item) =>
        schedules.some((s) => s.whatsappNumber === item.whatsappNumber && s.salesId === currentUser?.id)
      );

  const unreadCount = userInbox.filter((i) => i.unread).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dash', fullLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Sched', fullLabel: 'Schedule', icon: Calendar },
    { id: 'inbox', label: 'Inbox', fullLabel: 'Inbox', icon: Inbox, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'templates', label: 'Temp', fullLabel: 'Templates', icon: FileText },
    { id: 'users', label: 'Users', fullLabel: 'Users', icon: UsersIcon, adminOnly: true },
    { id: 'settings', label: 'Set', fullLabel: 'Settings', icon: SettingsIcon },
  ];

  // Filter out admin-only menu items if not admin
  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || currentUser?.role === 'Admin'
  );

  return (
    <div
      id="bottom-navbar"
      className="md:hidden h-14 bg-white dark:bg-zinc-900 border-t border-gray-150 dark:border-zinc-800/80 flex items-center justify-around px-2 shrink-0 pb-safe z-50 transition-colors duration-200"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center h-full relative cursor-pointer"
          >
            <div className="relative p-1">
              <Icon
                className={`h-5 w-5 transition-transform ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 scale-110'
                    : 'text-gray-400 dark:text-zinc-500'
                }`}
              />
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900 shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-bold mt-0.5 tracking-tight transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              {item.label}
            </span>

            {/* Indicator bar for active tab */}
            {isActive && (
              <span className="absolute top-0 left-4 right-4 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
