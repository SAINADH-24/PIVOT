"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RechargePageProps {
  onNavigate: (page: string) => void;
}

export function RechargePage({ onNavigate }: RechargePageProps) {
  const [validity, setValidity] = useState('28');
  const [dataAmount, setDataAmount] = useState([10]);
  const [dataMode, setDataMode] = useState('4g');
  const [voiceCalls, setVoiceCalls] = useState(false);
  const [unlimitedVoice, setUnlimitedVoice] = useState(false);
  const [ottPlatforms, setOttPlatforms] = useState<string[]>([]);

  const ottOptions = [
    { id: 'netflix', name: 'Netflix', price: 50 },
    { id: 'prime', name: 'Prime Video', price: 40 },
    { id: 'disney', name: 'Disney+', price: 45 },
    { id: 'spotify', name: 'Spotify', price: 30 }
  ];

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

  const aiSuggestion = {
    title: 'AI Optimization',
    message: 'Based on your usage, we recommend 5G for better streaming experience',
    savings: '₹50'
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
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
          <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{aiSuggestion.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{aiSuggestion.message}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Save {aiSuggestion.savings}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Configuration</CardTitle>
              <CardDescription>Customize your recharge plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validity */}
              <div className="space-y-2">
                <Label htmlFor="validity">Plan Validity</Label>
                <Select value={validity} onValueChange={setValidity}>
                  <SelectTrigger id="validity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="28">28 Days</SelectItem>
                    <SelectItem value="84">84 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Amount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Data Amount (GB)</Label>
                  <Badge variant="secondary" className="font-mono">
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 GB</span>
                  <span>100 GB</span>
                </div>
              </div>

              {/* Data Mode */}
              <div className="space-y-2">
                <Label htmlFor="dataMode">Data Mode</Label>
                <Select value={dataMode} onValueChange={setDataMode}>
                  <SelectTrigger id="dataMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4g">4G/LTE</SelectItem>
                    <SelectItem value="5g">
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
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="voice" 
                    checked={voiceCalls}
                    onCheckedChange={(checked) => setVoiceCalls(checked as boolean)}
                  />
                  <Label htmlFor="voice" className="cursor-pointer">
                    Add Voice Calls
                  </Label>
                </div>

                {voiceCalls && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unlimited" 
                        checked={unlimitedVoice}
                        onCheckedChange={(checked) => setUnlimitedVoice(checked as boolean)}
                      />
                      <Label htmlFor="unlimited" className="cursor-pointer flex items-center gap-2">
                        Unlimited Voice Calls
                        <Badge variant="secondary">+₹100</Badge>
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
                <Label>OTT Subscriptions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ottOptions.map((ott) => (
                    <div key={ott.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={ott.id}
                        checked={ottPlatforms.includes(ott.id)}
                        onCheckedChange={() => handleOttToggle(ott.id)}
                      />
                      <Label htmlFor={ott.id} className="cursor-pointer flex items-center gap-2">
                        {ott.name}
                        <span className="text-xs text-muted-foreground">+₹{ott.price}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
              <CardDescription>Your custom plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Cost</span>
                  <span className="text-2xl font-bold">₹{totalCost}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                  <span className="text-sm text-muted-foreground">Earn Pivot Points</span>
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    +{pivotPointsEarned} PP
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                Activate Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
