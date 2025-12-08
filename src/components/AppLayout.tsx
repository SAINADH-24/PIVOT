"use client";

import React, { useState } from 'react';
import { 
  Home, 
  Send, 
  Plus, 
  Smartphone, 
  Wallet, 
  History, 
  User, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface AppLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, refetch } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: Home },
    { name: 'Send Data', href: 'send-data', icon: Send },
    { name: 'Recharge', href: 'recharge', icon: Plus },
    { name: 'Devices', href: 'devices', icon: Smartphone },
    { name: 'Wallet', href: 'wallet', icon: Wallet },
    { name: 'History', href: 'history', icon: History },
    { name: 'Profile', href: 'profile', icon: User },
  ];

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    const token = localStorage.getItem("bearer_token");

    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (error?.code) {
      toast.error("Failed to logout. Please try again.");
      setIsLoggingOut(false);
      return;
    }

    localStorage.removeItem("bearer_token");
    toast.success("Successfully logged out!");
    refetch();
    // Force page refresh to clear all state
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-b z-50 flex items-center px-4 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-accent transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            P!VOT
          </h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar/95 backdrop-blur-xl border-r shadow-xl transition-transform duration-300 ease-in-out z-40 flex flex-col",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0 animate-slide-in-left" : "-translate-x-full"
      )}>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow hover-scale">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              P!VOT
            </h1>
          </div>

          <nav className="space-y-2 flex-1">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground hover:shadow-sm",
                    "stagger-item"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "" : "group-hover:scale-110"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="px-4 py-3 mb-3 rounded-xl bg-accent/50">
              <p className="text-sm font-medium text-foreground truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ''}
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive transition-all duration-200 group"
              variant="ghost"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "lg:ml-64 min-h-screen transition-all duration-300",
        "pt-20 lg:pt-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}