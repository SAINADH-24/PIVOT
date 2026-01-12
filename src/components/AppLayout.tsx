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
  LogOut,
  CreditCard,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { PlanBadge } from '@/components/PlanBadge';
import { useRouter } from 'next/navigation';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, refetch } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const { notifications, unreadCount, markAllAsRead } = useRealtimeNotifications();

  const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: Home },
    { name: 'Send Data', href: 'send-data', icon: Send },
    { name: 'Recharge', href: 'recharge', icon: Plus },
    { name: 'Devices', href: 'devices', icon: Smartphone },
    { name: 'Wallet', href: 'wallet', icon: Wallet },
    { name: 'History', href: 'history', icon: History },
    { name: 'Profile', href: 'profile', icon: User },
  ];

  const isAdmin = (session?.user as any)?.role === 'admin';
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: 'admin', icon: ShieldCheck });
  }

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
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            P!VOT
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 shrink-0",
                          notification.type === 'data_received' ? 'bg-green-500' : 'bg-blue-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <PlanBadge />
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
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain shadow-lg hover:shadow-xl transition-shadow hover-scale" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              P!VOT
            </h1>
          </div>

          {/* Plan Badge and Notification Bell - Desktop */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <PlanBadge />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b hover:bg-accent/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 shrink-0",
                            notification.type === 'data_received' ? 'bg-green-500' : 'bg-blue-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <nav className="space-y-2 flex-1">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.href === 'admin') {
                      router.push('/admin');
                    } else {
                      onNavigate(item.href);
                    }
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md" 
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

          {/* Pricing Link */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group hover-lift"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Upgrade Plan
                </p>
                <p className="text-xs text-muted-foreground">Get more features</p>
              </div>
            </button>
          </div>

          {/* User Info & Logout */}
          <div className="pt-6 border-t border-border">
            <div className="px-4 py-3 mb-3 rounded-xl bg-accent/50">
              <p className="text-sm font-medium text-foreground truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ''}
              </p>
              {session?.user?.udi && (
                <Badge variant="secondary" className="mt-2 text-xs font-mono">
                  {session.user.udi}
                </Badge>
              )}
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
