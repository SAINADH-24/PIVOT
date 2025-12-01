"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Coins, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SendDataPageProps {
  onNavigate: (page: string) => void;
}

export function SendDataPage({ onNavigate }: SendDataPageProps) {
  const { user, updateUser } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [network, setNetwork] = useState('');
  const [dataAmount, setDataAmount] = useState([1]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const networks = ['Airtel', 'Jio', 'Vi', 'BSNL'];
  
  // Calculate pivot points fee (10 points per GB)
  const pivotPointsFee = dataAmount[0] * 10;
  const canTransfer = user && user.dataBalance >= dataAmount[0] && user.pivotPoints >= pivotPointsFee;

  const handleTransfer = () => {
    if (!canTransfer) return;
    setShowConfirmation(true);
  };

  const confirmTransfer = () => {
    if (!user) return;

    // Update user data
    updateUser({
      dataBalance: user.dataBalance - dataAmount[0],
      pivotPoints: user.pivotPoints - pivotPointsFee
    });

    setShowConfirmation(false);
    setTransferSuccess(true);

    // Record transaction in localStorage
    const transactions = JSON.parse(localStorage.getItem('pivot_transactions') || '[]');
    transactions.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'transfer',
      amount: dataAmount[0],
      recipient: recipientPhone,
      network: network,
      fee: pivotPointsFee,
      date: new Date().toISOString(),
      status: 'completed'
    });
    localStorage.setItem('pivot_transactions', JSON.stringify(transactions));

    // Reset form after delay
    setTimeout(() => {
      setTransferSuccess(false);
      setRecipientPhone('');
      setNetwork('');
      setDataAmount([1]);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Send Data</h1>
          <p className="text-muted-foreground">Transfer data to friends and family</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Peer-to-Peer Data Transfer</CardTitle>
          <CardDescription>Send mobile data instantly using Pivot Points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Data</p>
              <p className="text-2xl font-bold">{user?.dataBalance.toFixed(1)} GB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pivot Points</p>
              <p className="text-2xl font-bold">{user?.pivotPoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="+1 234 567 8900"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network">Network Provider</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger id="network">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((net) => (
                    <SelectItem key={net} value={net}>{net}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                min={0.5}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5 GB</span>
                <span>10 GB</span>
              </div>
            </div>

            {/* Fee Calculation */}
            <Card className="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transfer Fee</span>
                  <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold">
                    <Coins className="w-4 h-4" />
                    <span>{pivotPointsFee} PP</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fee: 10 Pivot Points per GB • Instant transfer
                </p>
              </CardContent>
            </Card>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleTransfer}
            disabled={!recipientPhone || !network || !canTransfer}
          >
            <Send className="w-4 h-4 mr-2" />
            Send {dataAmount[0]} GB Data
          </Button>

          {!canTransfer && recipientPhone && network && (
            <p className="text-sm text-destructive text-center">
              Insufficient balance or pivot points
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              Please review the transfer details before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-semibold">{recipientPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-semibold">{network}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Amount</p>
                <p className="font-semibold">{dataAmount[0]} GB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transfer Fee</p>
                <p className="font-semibold text-violet-600 dark:text-violet-400">{pivotPointsFee} PP</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTransfer}>Confirm Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={transferSuccess} onOpenChange={setTransferSuccess}>
        <DialogContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl mb-2">Transfer Successful!</DialogTitle>
            <DialogDescription className="text-base">
              {dataAmount[0]} GB has been sent to {recipientPhone}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
