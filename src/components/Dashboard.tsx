"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { 
  Database, 
  Coins, 
  Smartphone, 
  ArrowRightLeft, 
  Send, 
  Plus, 
  Sparkles,
  TrendingUp,
  ArrowRight,
  History,
  Settings,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/useUserData';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: session, isPending: isSessionPending } = useSession();
  const { userData, transfers, unreadNotifications, loading: isDataLoading } = useUserData();
  // ...
      const kpiCards = [
        // ...
        {
          title: 'Total Transfers',
          value: transfers.length.toString(),
          icon: ArrowRightLeft,
          color: 'from-indigo-400 via-blue-500 to-blue-600',
          change: `${transfers.filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth()).length} this month`,
          bgGradient: 'from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-indigo-900/10'
        }
      ];

    const quickActions = [
      {
        title: 'Send Data',
        description: 'Transfer data to friends instantly',
        icon: Send,
        color: 'from-blue-400 to-blue-600',
        onClick: () => onNavigate('send-data')
      },
      {
        title: 'Build Custom Plan',
        description: 'Create your perfect recharge plan',
        icon: Plus,
        color: 'from-sky-400 to-blue-600',
        onClick: () => onNavigate('recharge')
      },
      {
        title: 'View History',
        description: 'Check recent activity & transactions',
        icon: History,
        color: 'from-indigo-400 to-blue-600',
        onClick: () => onNavigate('history')
      },
      {
        title: 'UDI / Devices',
        description: 'Manage connected devices',
        icon: Settings,
        color: 'from-blue-500 to-indigo-700',
        onClick: () => onNavigate('devices')
      }
    ];

  const aiSuggestions = [
    {
      title: 'Weekend Power Pack',
      data: '5 GB',
      validity: '3 days',
      price: '₹199',
      points: '50 PP',
      recommended: true
    },
    {
      title: 'Monthly Unlimited',
      data: '50 GB',
      validity: '28 days',
      price: '₹599',
      points: '200 PP',
      recommended: false
    }
  ];

  return (
    <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">Here's your mobile data overview</p>
          </div>
          <div className="relative">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl hover-scale">
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center p-1 rounded-full text-[10px] animate-pulse">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {kpiCards.map((kpi, index) => (
          <Card 
            key={index} 
            className={cn(
              "premium-card hover-lift stagger-item overflow-hidden",
              `bg-gradient-to-br ${kpi.bgGradient}`
            )}
          >
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center hover-scale ring-4 ring-white/20 dark:ring-white/10",
                    kpi.color
                  )}>
                    <kpi.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold mb-2">{kpi.value}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {kpi.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="premium-card hover-lift cursor-pointer group transition-all duration-300" 
              onClick={action.onClick}
            >
              <CardContent className="p-5">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 ring-4 ring-white/20 dark:ring-white/10",
                      action.color
                    )}>
                      <action.icon className="w-8 h-8 text-white" />
                    </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Suggested Plans */}
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Suggested Plans</CardTitle>
                <CardDescription>Personalized plans based on your usage patterns</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiSuggestions.map((plan, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer group",
                  plan.recommended 
                    ? "bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800" 
                    : "bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg">{plan.title}</h4>
                    {plan.recommended && (
                      <Badge variant="secondary" className="bg-blue-600 text-white animate-scale-in">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">{plan.data}</span>
                    <span>•</span>
                    <span>{plan.validity}</span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{plan.points}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <Button 
                    size="default" 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover-lift"
                  >
                    Activate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}