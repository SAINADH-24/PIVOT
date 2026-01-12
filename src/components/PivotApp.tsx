"use client";

import React, { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { AuthPage } from './AuthPage';
import { AppLayout } from './AppLayout';
import { Dashboard } from './Dashboard';
import { SendDataPage } from './SendDataPage';
import { RechargePage } from './RechargePage';
import { DevicesPage } from './DevicesPage';
import { WalletPage } from './WalletPage';
import { HistoryPage } from './HistoryPage';
import { ProfilePage } from './ProfilePage';

function AppContent() {
  const { data: session, isPending } = useSession();
  const [currentPage, setCurrentPage] = useState('dashboard');

    // Show loading state while checking session
    if (isPending) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

  // Show auth page if not authenticated
  if (!session?.user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'send-data':
        return <SendDataPage onNavigate={setCurrentPage} />;
      case 'recharge':
        return <RechargePage onNavigate={setCurrentPage} />;
      case 'devices':
        return <DevicesPage onNavigate={setCurrentPage} />;
      case 'wallet':
        return <WalletPage onNavigate={setCurrentPage} />;
      case 'history':
        return <HistoryPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  );
}

export function PivotApp() {
  return <AppContent />;
}