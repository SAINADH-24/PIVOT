"use client";

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from './AuthPage';
import { AppLayout } from './AppLayout';
import { Dashboard } from './Dashboard';
import { SendDataPage } from './SendDataPage';
import { RechargePage } from './RechargePage';
import { DevicesPage } from './DevicesPage';
import { WalletPage } from './WalletPage';
import { HistoryPage } from './HistoryPage';
import { ProfilePage } from './ProfilePage';
import { Toaster } from 'sonner';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
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
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
