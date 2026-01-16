"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, TrendingUp, Gift, ShoppingBag, Send, Plus, Check, Sparkles, IndianRupee } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const { data: session, isPending } = useSession();
  const [showBuyPointsModal, setShowBuyPointsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Pivot Points packages with INR pricing
  const pointsPackages = [
    { 
      id: 1, 
      points: 100, 
      price: 49, 
      perPoint: 0.49, 
      popular: false,
      bonus: 0,
      label: 'Starter'
    },
    { 
      id: 2, 
      points: 500, 
      price: 199, 
      perPoint: 0.40, 
      popular: false,
      bonus: 25,
      label: 'Basic'
    },
    { 
      id: 3, 
      points: 1000, 
      price: 349, 
      perPoint: 0.35, 
      popular: true,
      bonus: 100,
      label: 'Popular'
    },
    { 
      id: 4, 
      points: 2500, 
      price: 749, 
      perPoint: 0.30, 
      popular: false,
      bonus: 375,
      label: 'Value'
    },
    { 
      id: 5, 
      points: 5000, 
      price: 1299, 
      perPoint: 0.26, 
      popular: false,
      bonus: 1000,
      label: 'Pro'
    },
    { 
      id: 6, 
      points: 10000, 
      price: 2299, 
      perPoint: 0.23, 
      popular: false,
      bonus: 2500,
      label: 'Ultimate'
    },
  ];

  const handleBuyPoints = async (pkg: typeof pointsPackages[0]) => {
    setSelectedPackage(pkg.id);
    setIsPurchasing(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };
  
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
    { name: 'Bronze', points: 0, benefits: 'Basic rewards', color: 'from-orange-700 to-amber-600' },
    { name: 'Silver', points: 1000, benefits: '5% extra cashback', color: 'from-gray-400 to-gray-500' },
    { name: 'Gold', points: 5000, benefits: '10% extra cashback', color: 'from-yellow-400 to-amber-500' },
    { name: 'Platinum', points: 10000, benefits: '15% extra cashback + Priority support', color: 'from-slate-300 to-slate-400' }
  ];

  const user = session?.user;
  const userPivotPoints = user?.pivotPoints || 0;

  const currentTier = [...rewardTiers].reverse().find(tier => userPivotPoints >= tier.points) || rewardTiers[0];
  const nextTier = rewardTiers.find(tier => tier.points > userPivotPoints);

  const redeemOptions = [
    { id: 1, name: 'Data Top-up', points: 100, value: '1 GB', icon: 'data' },
    { id: 2, name: 'Data Top-up', points: 500, value: '5 GB', icon: 'data' },
    { id: 3, name: 'Amazon Voucher', points: 1000, value: '₹100', icon: 'voucher' },
    { id: 4, name: 'Netflix 1 Month', points: 2000, value: 'Premium', icon: 'streaming' }
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

  const handleRedeem = (option: typeof redeemOptions[0]) => {
    if (userPivotPoints < option.points) {
      toast.error('Insufficient Pivot Points');
      return;
    }
    toast.success(`${option.name} redeemed successfully!`);
  };

  // Show loading state
  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pivot Points Wallet</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card className="premium-card">
          <CardContent className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 animate-fade-in-up">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate('dashboard')}
          className="hover-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pivot Points Wallet</h1>
          <p className="text-muted-foreground">Manage your rewards and redeem benefits</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="premium-card border-0 shadow-2xl animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.1s' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600" />
        <CardContent className="relative p-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-100 mb-2 text-base">Total Balance</p>
              <h2 className="text-6xl font-bold mb-2">{userPivotPoints.toLocaleString()}</h2>
              <p className="text-blue-100 text-lg">Pivot Points</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse-glow">
              <Coins className="w-10 h-10" />
            </div>
          </div>
              <div className="flex items-center gap-4">
                <Button 
                  className="bg-white text-blue-600 hover:bg-white/90 font-semibold hover-lift"
                  onClick={() => setShowBuyPointsModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buy Points
                </Button>
                <Button 
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30 font-semibold hover-scale"
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
              </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Rewards Tier
          </CardTitle>
          <CardDescription>Your current membership level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge className={cn("mb-2 bg-gradient-to-r text-white", currentTier.color)}>
                  {currentTier.name}
                </Badge>
                <p className="text-sm text-muted-foreground">{currentTier.benefits}</p>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-sm font-bold">Next: {nextTier.name}</p>
                  <p className="text-xs text-muted-foreground">{(nextTier.points - userPivotPoints).toLocaleString()} PP away</p>
                </div>
              )}
            </div>
            {nextTier && (
              <div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min((userPivotPoints / nextTier.points) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {userPivotPoints.toLocaleString()} / {nextTier.points.toLocaleString()} PP
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="redeem" className="w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="redeem" className="text-base">Redeem</TabsTrigger>
          <TabsTrigger value="history" className="text-base">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="redeem" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redeemOptions.map((option, index) => (
              <Card 
                key={option.id} 
                className={cn(
                  "premium-card hover-lift cursor-pointer group stagger-item",
                  userPivotPoints < option.points && "opacity-60"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                      <ShoppingBag className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                      {option.points} PP
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{option.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{option.value}</p>
                  <Button 
                    className="w-full hover-lift" 
                    size="default"
                    disabled={userPivotPoints < option.points}
                    onClick={() => handleRedeem(option)}
                  >
                    Redeem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent Pivot Points activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <div 
                      key={transaction.id} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer stagger-item",
                        transaction.type === 'earned' && "bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900",
                        transaction.type === 'spent' && "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900",
                          transaction.type === 'bonus' && "bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                            transaction.type === 'earned' && 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
                            transaction.type === 'spent' && 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30',
                            transaction.type === 'bonus' && 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30'
                          )}>
                            <Icon className={cn(
                              "w-6 h-6",
                              transaction.type === 'earned' && 'text-green-600 dark:text-green-400',
                              transaction.type === 'spent' && 'text-red-600 dark:text-red-400',
                              transaction.type === 'bonus' && 'text-blue-600 dark:text-blue-400'
                            )} />

                        </div>
                        <div>
                          <p className="font-semibold text-base">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-bold text-lg",
                        transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
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

        {/* Buy Points Modal */}
        <Dialog open={showBuyPointsModal} onOpenChange={setShowBuyPointsModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                Buy Pivot Points
              </DialogTitle>
              <DialogDescription>
                Choose a package that fits your needs. Bigger packages = Better value!
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {pointsPackages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 hover:shadow-lg",
                    pkg.popular && "ring-2 ring-blue-500 shadow-lg",
                    selectedPackage === pkg.id && isPurchasing && "opacity-50"
                  )}
                  onClick={() => !isPurchasing && handleBuyPoints(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {pkg.bonus > 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                        +{pkg.bonus} Bonus
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="text-center space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {pkg.label}
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="w-6 h-6 text-amber-500" />
                        <span className="text-3xl font-bold">{pkg.points.toLocaleString()}</span>
                      </div>
                      {pkg.bonus > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          + {pkg.bonus} bonus points
                        </p>
                      )}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground">
                          <IndianRupee className="w-5 h-5" />
                          <span>{pkg.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ₹{pkg.perPoint.toFixed(2)} per point
                        </p>
                      </div>
                      <Button 
                        className={cn(
                          "w-full",
                          pkg.popular 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                            : ""
                        )}
                        disabled={isPurchasing}
                      >
                        {selectedPackage === pkg.id && isPurchasing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-500" />
                Why Buy Pivot Points?
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Redeem for free data top-ups
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Get exclusive vouchers & rewards
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Unlock premium membership tiers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Points never expire
                </li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}