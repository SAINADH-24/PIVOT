"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlanUsageIndicator } from '@/components/PlanUsageIndicator';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();

  const kpiCards = [
    {
      title: 'Data Balance',
      value: `${user?.dataBalance.toFixed(1)} GB`,
      icon: Database,
      color: 'from-blue-500 to-cyan-500',
      change: '+2.5 GB this week',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
    },
    {
      title: 'Pivot Points',
      value: user?.pivotPoints.toLocaleString() || '0',
      icon: Coins,
      color: 'from-violet-500 to-purple-500',
      change: '+150 points',
      bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20'
    },
    {
      title: 'Active Devices',
      value: '3',
      icon: Smartphone,
      color: 'from-emerald-500 to-teal-500',
      change: '2 connected',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
    },
    {
      title: 'Total Transfers',
      value: '47',
      icon: ArrowRightLeft,
      color: 'from-orange-500 to-pink-500',
      change: '12 this month',
      bgGradient: 'from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20'
    }
  ];

  const quickActions = [
    {
      title: 'Send Data',
      description: 'Transfer data to friends instantly',
      icon: Send,
      color: 'from-blue-500 to-cyan-500',
      onClick: () => onNavigate('send-data')
    },
    {
      title: 'Build Custom Plan',
      description: 'Create your perfect recharge plan',
      icon: Plus,
      color: 'from-violet-500 to-fuchsia-600',
      onClick: () => onNavigate('recharge')
    },
    {
      title: 'View History',
      description: 'Check recent activity & transactions',
      icon: History,
      color: 'from-emerald-500 to-teal-500',
      onClick: () => onNavigate('history')
    },
    {
      title: 'UDI / Devices',
      description: 'Manage connected devices',
      icon: Settings,
      color: 'from-orange-500 to-pink-500',
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
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">Here's your mobile data overview</p>
      </div>

      {/* Plan Usage Indicator */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <PlanUsageIndicator />
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
                  "w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center hover-scale",
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
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                    "w-16 h-16 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center transition-transform group-hover:scale-110",
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
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center animate-pulse-glow">
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
                    ? "bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border-violet-200 dark:border-violet-800" 
                    : "bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg">{plan.title}</h4>
                    {plan.recommended && (
                      <Badge variant="secondary" className="bg-violet-600 text-white animate-scale-in">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">{plan.data}</span>
                    <span>•</span>
                    <span>{plan.validity}</span>
                    <span>•</span>
                    <span className="text-violet-600 dark:text-violet-400 font-semibold">{plan.points}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <Button 
                    size="default" 
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white shadow-md hover-lift"
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