/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { BottomNavbar } from './components/BottomNavbar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Inbox } from './components/Inbox';
import { Templates } from './components/Templates';
import { Users } from './components/Users';
import { Settings } from './components/Settings';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmDialog } from './components/ConfirmDialog';

const MainAppContent: React.FC = () => {
  const { currentUser, activeTab } = useApp();

  // If not logged in, render the clean login screen
  if (!currentUser) {
    return (
      <>
        <Login />
        <ConfirmDialog />
        <ToastContainer />
      </>
    );
  }

  // Render correct panel viewport
  const renderActiveViewport = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <Schedule />;
      case 'inbox':
        return <Inbox />;
      case 'templates':
        return <Templates />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
      <div id="app-workspace" className="flex h-full w-full max-w-[1380px] overflow-hidden bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 transition-colors duration-200 font-sans border-x border-gray-200/50 dark:border-zinc-800 shadow-2xl">
        {/* Small Sidebar Navigation */}
        <Sidebar />

        {/* Workspace Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header toolbar */}
          <Header />

          {/* View content */}
          <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/40 dark:bg-zinc-950/20">
            {renderActiveViewport()}
          </main>

          {/* Bottom Navbar for mobile */}
          <BottomNavbar />
        </div>
      </div>

      {/* Floating notification tray */}
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
