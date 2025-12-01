"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, TrendingUp, Gift, ShoppingBag, Send, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WalletPageProps {
  onNavigate: (page: string) => void;
}

interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  date: string;
}

export function WalletPage({ onNavigate }: WalletPageProps) {
  const { user } = useAuth();
  
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'earned',
      amount: 200,
      description: 'Recharge cashback',
      date: '2024-01-15'
    },
    {
      id: '2',
      type: 'spent',
      amount: -50,
      description: 'Data transfer fee',
      date: '2024-01-14'
    },
    {
      id: '3',
      type: 'bonus',
      amount: 500,
      description: 'Welcome bonus',
      date: '2024-01-10'
    },
    {
      id: '4',
      type: 'earned',
      amount: 150,
      description: 'Referral reward',
      date: '2024-01-08'
    }
  ]);

  const rewardTiers = [
    { name: 'Bronze', points: 0, benefits: 'Basic rewards' },
    { name: 'Silver', points: 1000, benefits: '5% extra cashback' },
    { name: 'Gold', points: 5000, benefits: '10% extra cashback' },
    { name: 'Platinum', points: 10000, benefits: '15% extra cashback + Priority support' }
  ];

  const currentTier = rewardTiers.reverse().find(tier => (user?.pivotPoints || 0) >= tier.points) || rewardTiers[0];
  const nextTier = rewardTiers.find(tier => tier.points > (user?.pivotPoints || 0));

  const redeemOptions = [
    { id: 1, name: 'Data Top-up', points: 100, value: '1 GB' },
    { id: 2, name: 'Data Top-up', points: 500, value: '5 GB' },
    { id: 3, name: 'Amazon Voucher', points: 1000, value: '₹100' },
    { id: 4, name: 'Netflix 1 Month', points: 2000, value: 'Premium' }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return TrendingUp;
      case 'spent':
        return Send;
      case 'bonus':
        return Gift;
      default:
        return Coins;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pivot Points Wallet</h1>
          <p className="text-muted-foreground">Manage your rewards and redeem benefits</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-violet-100 mb-2">Total Balance</p>
              <h2 className="text-5xl font-bold">{user?.pivotPoints.toLocaleString()}</h2>
              <p className="text-violet-100 mt-1">Pivot Points</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Coins className="w-8 h-8" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-white text-purple-600 hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Buy Points
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Rewards Tier</CardTitle>
          <CardDescription>Your current membership level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2">{currentTier.name}</Badge>
                <p className="text-sm text-muted-foreground">{currentTier.benefits}</p>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-sm font-semibold">Next: {nextTier.name}</p>
                  <p className="text-xs text-muted-foreground">{nextTier.points - (user?.pivotPoints || 0)} PP away</p>
                </div>
              )}
            </div>
            {nextTier && (
              <div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: `${Math.min(((user?.pivotPoints || 0) / nextTier.points) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.pivotPoints.toLocaleString()} / {nextTier.points.toLocaleString()} PP
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="redeem" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="redeem" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redeemOptions.map((option) => (
              <Card key={option.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {option.points} PP
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{option.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{option.value}</p>
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={(user?.pivotPoints || 0) < option.points}
                  >
                    Redeem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent Pivot Points activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'earned' ? 'bg-green-100 dark:bg-green-900/20' :
                          transaction.type === 'spent' ? 'bg-red-100 dark:bg-red-900/20' :
                          'bg-blue-100 dark:bg-blue-900/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            transaction.type === 'earned' ? 'text-green-600 dark:text-green-400' :
                            transaction.type === 'spent' ? 'text-red-600 dark:text-red-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} PP
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
