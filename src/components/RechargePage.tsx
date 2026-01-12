"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Sparkles, Zap, TrendingUp, Wifi, Video, Music, Gamepad2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCustomer } from 'autumn-js/react';
import { useRouter } from 'next/navigation';

interface RechargePageProps {
  onNavigate: (page: string) => void;
}

// Mock usage history dataset
interface UsageDay {
  date: string;
  gbUsed: number;
  primaryCategory: 'Streaming' | 'Social' | 'Work' | 'Gaming';
}

const generateMockUsageHistory = (): UsageDay[] => {
  const categories: UsageDay['primaryCategory'][] = ['Streaming', 'Social', 'Work', 'Gaming'];
  const history: UsageDay[] = [];
  
  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      gbUsed: Math.random() * 3 + 0.5, // 0.5 - 3.5 GB per day
      primaryCategory: categories[Math.floor(Math.random() * categories.length)]
    });
  }
  
  return history;
};

interface AISuggestion {
  validity: string;
  dataAmount: number;
  dataMode: string;
  voiceCalls: boolean;
  unlimitedVoice: boolean;
  ottPlatforms: string[];
  reason: string;
  confidence: number;
}

const analyzeUsageAndSuggest = (history: UsageDay[]): AISuggestion => {
  const avgDailyUsage = history.reduce((sum, day) => sum + day.gbUsed, 0) / history.length;
  const totalUsage = history.reduce((sum, day) => sum + day.gbUsed, 0);
  
  // Count category occurrences
  const categoryCount: Record<string, number> = {};
  history.forEach(day => {
    categoryCount[day.primaryCategory] = (categoryCount[day.primaryCategory] || 0) + 1;
  });
  
  const dominantCategory = Object.entries(categoryCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  // Determine validity
  let validity = '28';
  let reason = '';
  
  if (avgDailyUsage > 2.5) {
    validity = '28';
    reason = 'Heavy usage detected - monthly plan recommended';
  } else if (avgDailyUsage > 1.5) {
    validity = '14';
    reason = 'Moderate usage - bi-weekly plan optimal';
  } else {
    validity = '7';
    reason = 'Light usage - weekly plan saves money';
  }
  
  // Determine data mode
  const dataMode = avgDailyUsage > 2 || dominantCategory === 'Streaming' || dominantCategory === 'Gaming' ? '5g' : '4g';
  
  // Calculate suggested data amount
  const suggestedData = Math.ceil(totalUsage * 1.2); // 20% buffer
  
  // Suggest OTT platforms based on dominant category
  const ottPlatforms: string[] = [];
  if (dominantCategory === 'Streaming') {
    ottPlatforms.push('netflix', 'prime', 'disney');
    reason += ' with streaming bundles';
  } else if (dominantCategory === 'Social') {
    ottPlatforms.push('spotify');
    reason += ' with music streaming';
  } else if (dominantCategory === 'Gaming') {
    ottPlatforms.push('prime');
    reason += ' with gaming perks';
  }
  
  // Voice calls - suggest unlimited for heavy users
  const voiceCalls = avgDailyUsage > 1.5;
  const unlimitedVoice = avgDailyUsage > 2;
  
  return {
    validity,
    dataAmount: suggestedData,
    dataMode,
    voiceCalls,
    unlimitedVoice,
    ottPlatforms,
    reason,
    confidence: Math.min(95, 75 + history.length)
  };
};

export function RechargePage({ onNavigate }: RechargePageProps) {
  const { customer, check, isLoading: isCustomerLoading } = useCustomer();
  const router = useRouter();
  
  const [validity, setValidity] = useState('28');
  const [dataAmount, setDataAmount] = useState([10]);
  const [dataMode, setDataMode] = useState('4g');
  const [voiceCalls, setVoiceCalls] = useState(false);
  const [unlimitedVoice, setUnlimitedVoice] = useState(false);
  const [ottPlatforms, setOttPlatforms] = useState<string[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageDay[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  const ottOptions = [
    { id: 'netflix', name: 'Netflix', price: 50, icon: Video },
    { id: 'prime', name: 'Prime Video', price: 40, icon: Video },
    { id: 'disney', name: 'Disney+', price: 45, icon: Video },
    { id: 'spotify', name: 'Spotify', price: 30, icon: Music }
  ];

  useEffect(() => {
    const history = generateMockUsageHistory();
    setUsageHistory(history);
    const suggestion = analyzeUsageAndSuggest(history);
    setAiSuggestion(suggestion);
  }, []);

  // Check feature access
  const hasCustomBuilder = customer?.products?.some(p => 
    p.id !== 'free' && ['starter', 'pro', 'unlimited'].includes(p.id)
  );
  const hasAISuggestions = customer?.products?.some(p => 
    ['pro', 'unlimited'].includes(p.id)
  );

  // Cost calculation
  const baseCost = dataAmount[0] * 15; // ₹15 per GB
  const validityMultiplier = validity === '7' ? 0.4 : validity === '14' ? 0.7 : validity === '28' ? 1 : 1.5;
  const dataModeCost = dataMode === '5g' ? baseCost * 0.3 : 0;
  const voiceCost = voiceCalls ? (unlimitedVoice ? 100 : 50) : 0;
  const ottCost = ottPlatforms.reduce((acc, platform) => {
    const ott = ottOptions.find(o => o.id === platform);
    return acc + (ott?.price || 0);
  }, 0);

  const totalCost = Math.round((baseCost * validityMultiplier) + dataModeCost + voiceCost + ottCost);
  const pivotPointsEarned = Math.round(totalCost * 0.1); // 10% cashback in PP

  const handleOttToggle = (platformId: string) => {
    setOttPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    
    // FEATURE GATE: Check AI suggestions access
    if (!hasAISuggestions) {
      toast.error('AI suggestions are available on Pro and Unlimited plans only!', {
        action: {
          label: 'Upgrade to Pro',
          onClick: () => router.push('/pricing')
        },
        duration: 5000
      });
      return;
    }
    
    setValidity(aiSuggestion.validity);
    setDataAmount([aiSuggestion.dataAmount]);
    setDataMode(aiSuggestion.dataMode);
    setVoiceCalls(aiSuggestion.voiceCalls);
    setUnlimitedVoice(aiSuggestion.unlimitedVoice);
    setOttPlatforms(aiSuggestion.ottPlatforms);
    
    toast.success('AI suggested plan applied!');
  };

  const handleActivatePlan = async () => {
    // Validate data amount
    if (dataAmount[0] <= 0) {
      toast.error('Data amount must be greater than 0');
      return;
    }

    // FEATURE GATE: Check custom recharge builder access
    if (!hasCustomBuilder) {
      toast.error('Custom recharge builder is a premium feature. Upgrade to access it!', {
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/pricing')
        },
        duration: 5000
      });
      return;
    }

    toast.success(`Plan activated! ₹${totalCost} | Earned ${pivotPointsEarned} Pivot Points`);
    
    // Record in history
    const transactions = JSON.parse(localStorage.getItem('pivot_transactions') || '[]');
    transactions.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'recharge',
      amount: dataAmount[0],
      validity: validity,
      cost: totalCost,
      date: new Date().toISOString(),
      status: 'completed'
    });
    localStorage.setItem('pivot_transactions', JSON.stringify(transactions));
  };

  // Usage stats
  const avgDailyUsage = usageHistory.length > 0 
    ? (usageHistory.reduce((sum, day) => sum + day.gbUsed, 0) / usageHistory.length).toFixed(1)
    : '0';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Streaming': return Video;
      case 'Gaming': return Gamepad2;
      case 'Social': return Music;
      default: return Wifi;
    }
  };

  // Show loading state
  if (isCustomerLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Recharge Builder</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card className="premium-card">
          <CardContent className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold">Recharge Builder</h1>
          <p className="text-muted-foreground">Create your perfect custom plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Suggestion Banner */}
          {aiSuggestion && (
            <Card className={cn(
              "premium-card hover-lift animate-fade-in-up",
              !hasAISuggestions && "opacity-60 relative overflow-hidden"
            )}>
              {!hasAISuggestions && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="text-center space-y-3 p-6">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-bold text-lg mb-1">Pro Feature</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          AI suggestions are available on Pro and Unlimited plans
                        </p>
                        <Button 
                          onClick={() => router.push('/pricing')}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse-glow">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                          AI Optimized Plan
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {aiSuggestion.confidence}% Match
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">{aiSuggestion.reason}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Avg: {avgDailyUsage} GB/day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{aiSuggestion.dataMode.toUpperCase()} recommended</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={applyAISuggestion}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover-lift"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Apply AI Suggested Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Plan Configuration */}
          <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan Configuration</CardTitle>
                  <CardDescription>Customize your recharge plan</CardDescription>
                </div>
                {!hasCustomBuilder && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validity */}
              <div className="space-y-2">
                <Label htmlFor="validity" className="text-base font-semibold">Plan Validity</Label>
                <Select value={validity} onValueChange={setValidity}>
                  <SelectTrigger id="validity" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="text-base">7 Days</SelectItem>
                    <SelectItem value="14" className="text-base">14 Days</SelectItem>
                    <SelectItem value="28" className="text-base">28 Days</SelectItem>
                    <SelectItem value="84" className="text-base">84 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Amount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Data Amount (GB)</Label>
                  <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                    {dataAmount[0]} GB
                  </Badge>
                </div>
                <Slider
                  value={dataAmount}
                  onValueChange={setDataAmount}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 GB</span>
                  <span>100 GB</span>
                </div>
              </div>

              {/* Data Mode */}
              <div className="space-y-2">
                <Label htmlFor="dataMode" className="text-base font-semibold">Data Mode</Label>
                <Select value={dataMode} onValueChange={setDataMode}>
                  <SelectTrigger id="dataMode" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4g" className="text-base">4G/LTE</SelectItem>
                    <SelectItem value="5g" className="text-base">
                      <div className="flex items-center gap-2">
                        5G
                        <Badge variant="secondary" className="text-xs">+₹{Math.round(baseCost * 0.3)}</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Voice Calls */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="voice" 
                    checked={voiceCalls}
                    onCheckedChange={(checked) => {
                      setVoiceCalls(checked as boolean);
                      if (!checked) setUnlimitedVoice(false);
                    }}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="voice" className="cursor-pointer text-base font-semibold">
                    Add Voice Calls
                  </Label>
                </div>

                {voiceCalls && (
                  <div className="ml-8 space-y-3 animate-fade-in-up">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="unlimited" 
                        checked={unlimitedVoice}
                        onCheckedChange={(checked) => setUnlimitedVoice(checked as boolean)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="unlimited" className="cursor-pointer flex items-center gap-2">
                        Unlimited Voice Calls
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">+₹100</Badge>
                      </Label>
                    </div>
                    {!unlimitedVoice && (
                      <p className="text-sm text-muted-foreground">Limited calls: ₹50</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* OTT Subscriptions */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">OTT Subscriptions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ottOptions.map((ott) => {
                    const Icon = ott.icon;
                    return (
                      <div 
                        key={ott.id} 
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                          ottPlatforms.includes(ott.id) 
                            ? "bg-violet-50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700" 
                            : "hover:bg-accent"
                        )}
                        onClick={() => handleOttToggle(ott.id)}
                      >
                        <Checkbox 
                          id={ott.id}
                          checked={ottPlatforms.includes(ott.id)}
                          onCheckedChange={() => handleOttToggle(ott.id)}
                          className="h-5 w-5"
                        />
                        <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        <div className="flex-1">
                          <Label htmlFor={ott.id} className="cursor-pointer font-medium">
                            {ott.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">+₹{ott.price}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 premium-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
              <CardDescription>Your custom plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Plan Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-semibold">{dataAmount[0]} GB ({dataMode.toUpperCase()})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validity</span>
                  <span className="font-semibold">{validity} days</span>
                </div>
                {voiceCalls && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voice Calls</span>
                    <span className="font-semibold">{unlimitedVoice ? 'Unlimited' : 'Limited'}</span>
                  </div>
                )}
                {ottPlatforms.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">OTT Platforms</span>
                    <span className="font-semibold">{ottPlatforms.length} selected</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Cost</span>
                  <span>₹{Math.round(baseCost * validityMultiplier)}</span>
                </div>
                {dataMode === '5g' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">5G Upgrade</span>
                    <span>₹{Math.round(dataModeCost)}</span>
                  </div>
                )}
                {voiceCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voice Calls</span>
                    <span>₹{voiceCost}</span>
                  </div>
                )}
                {ottCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">OTT Add-ons</span>
                    <span>₹{ottCost}</span>
                  </div>
                )}
              </div>

              <Separator />

                {/* Total */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Cost</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">₹{totalCost}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900">
                    <span className="text-sm font-medium text-muted-foreground">Earn Pivot Points</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      +{pivotPointsEarned} PP
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover-lift" 
                  size="lg"
                  onClick={handleActivatePlan}
                  disabled={!hasCustomBuilder}
                >
                {hasCustomBuilder ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Activate Plan
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Upgrade to Unlock
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}