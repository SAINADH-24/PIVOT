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
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      change: '+2.5 GB this week'
    },
    {
      title: 'Pivot Points',
      value: user?.pivotPoints.toLocaleString() || '0',
      icon: Coins,
      color: 'from-violet-500 to-purple-500',
      change: '+150 points'
    },
    {
      title: 'Active Devices',
      value: '3',
      icon: Smartphone,
      color: 'from-emerald-500 to-teal-500',
      change: '2 connected'
    },
    {
      title: 'Total Transfers',
      value: '47',
      icon: ArrowRightLeft,
      color: 'from-orange-500 to-pink-500',
      change: '12 this month'
    }
  ];

  const quickActions = [
    {
      title: 'Send Data',
      description: 'Transfer data to friends',
      icon: Send,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => onNavigate('send-data')
    },
    {
      title: 'Build Recharge',
      description: 'Create custom plan',
      icon: Plus,
      color: 'bg-violet-500 hover:bg-violet-600',
      onClick: () => onNavigate('recharge')
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's your mobile data overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold mb-1">{kpi.value}</p>
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={action.onClick}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center transition-colors`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Suggested Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Suggested Plans
          </CardTitle>
          <CardDescription>Personalized plans based on your usage patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiSuggestions.map((plan, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{plan.title}</h4>
                    {plan.recommended && (
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{plan.data}</span>
                    <span>•</span>
                    <span>{plan.validity}</span>
                    <span>•</span>
                    <span className="text-violet-600 dark:text-violet-400 font-medium">{plan.points}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">{plan.price}</span>
                  <Button size="sm">Activate</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
