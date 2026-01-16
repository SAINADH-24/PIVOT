"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSession } from '@/lib/auth-client';
import { Send, Coins, CheckCircle2, ArrowLeft, AlertCircle, QrCode, User, Loader2, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QrScanner } from '@/components/QrScanner';

interface SendDataPageProps {
  onNavigate: (page: string) => void;
}

interface RecipientInfo {
  id: string;
  name: string;
  udi: string | null;
  email: string;
}

export function SendDataPage({ onNavigate }: SendDataPageProps) {
  const { data: session, isPending } = useSession();
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [dataAmount, setDataAmount] = useState([1]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MOCK_PIN = '1234';
  const pivotPointsFee = dataAmount[0] * 10;
  const userDataBalance = session?.user?.dataBalance || 0;
  const userPivotPoints = session?.user?.pivotPoints || 0;

  const lookupRecipient = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setRecipientInfo(null);
      setLookupError('');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');

    try {
      const response = await fetch(`/api/users/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (data.found && data.user) {
        setRecipientInfo(data.user);
        setLookupError('');
      } else {
        setRecipientInfo(null);
        setLookupError(data.error || 'User not found');
      }
    } catch (error) {
      setRecipientInfo(null);
      setLookupError('Failed to lookup user');
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (recipientQuery.trim().length >= 2) {
        lookupRecipient(recipientQuery);
      } else {
        setRecipientInfo(null);
        setLookupError('');
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [recipientQuery, lookupRecipient]);

  const handleTransfer = async () => {
    if (!recipientInfo) {
      toast.error('Please enter a valid recipient');
      return;
    }

    if (dataAmount[0] > userDataBalance) {
      toast.error('Insufficient data balance');
      return;
    }

    if (pivotPointsFee > userPivotPoints) {
      toast.error('Insufficient Pivot Points for fee');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmClick = () => {
    setShowConfirmation(false);
    setShowPinDialog(true);
    setPin('');
    setPinError('');
  };

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setPinError('');
  };

  const confirmTransfer = async () => {
    if (!session?.user || !recipientInfo) return;

    if (pin !== MOCK_PIN) {
      setPinError('Invalid PIN. Please try again.');
      setPin('');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/data/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIdentifier: recipientInfo.udi || recipientInfo.email,
          amount: dataAmount[0],
          fee: pivotPointsFee
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Transfer failed');
      }

      setShowPinDialog(false);
      setTransferSuccess(true);

      toast.success(`Data transfer successful! ${dataAmount[0]} GB sent to ${recipientInfo.name}`);

      setTimeout(() => {
        setTransferSuccess(false);
        setRecipientQuery('');
        setRecipientInfo(null);
        setDataAmount([1]);
        setIsSubmitting(false);
        setPin('');
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
      setIsSubmitting(false);
      setPin('');
    }
  };

  const handleScanQr = () => {
    setShowQrScanner(true);
  };

  const handleQrScanSuccess = (decodedText: string) => {
    let lookupValue = decodedText.trim();
    
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.type === 'pivotal' || parsed.udi || parsed.phone) {
        lookupValue = parsed.udi || parsed.phone || parsed.email || decodedText.trim();
      }
    } catch {
    }
    
    setRecipientQuery(lookupValue);
    setShowQrScanner(false);
    toast.success('QR code scanned! Looking up user...');
  };

  if (isPending) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Send Data</h1>
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

  const isFormValid = recipientInfo && dataAmount[0] <= userDataBalance && pivotPointsFee <= userPivotPoints;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold">Send Data</h1>
          <p className="text-muted-foreground">Transfer data to friends and family</p>
        </div>
      </div>

      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle>Peer-to-Peer Data Transfer</CardTitle>
          <CardDescription>Send mobile data instantly to any registered P!VOT user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border border-blue-100 dark:border-blue-900">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Available Data</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {userDataBalance.toFixed(1)} GB
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Pivot Points</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {userPivotPoints.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-base font-semibold">
                Recipient (UDI, Email, or Phone)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="recipient"
                  type="text"
                  placeholder="Enter UDI (e.g., UDI-ABC123), email, or phone"
                  value={recipientQuery}
                  onChange={(e) => setRecipientQuery(e.target.value)}
                  className="h-12 text-base flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 hover-scale"
                  onClick={handleScanQr}
                  title="Scan QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </Button>
              </div>

              {isLookingUp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up user...</span>
                </div>
              )}

              {lookupError && !isLookingUp && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                  <AlertCircle className="w-4 h-4" />
                  <span>{lookupError}</span>
                </div>
              )}

              {recipientInfo && !isLookingUp && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">{recipientInfo.name}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {recipientInfo.udi || recipientInfo.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Verified
                    </Badge>
                  </div>
                </div>
              )}
            </div>

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
                min={0.5}
                max={Math.min(10, userDataBalance || 10)}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0.5 GB</span>
                <span>{Math.min(10, userDataBalance || 10)} GB</span>
              </div>
              {dataAmount[0] > userDataBalance && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>Insufficient data balance</span>
                </div>
              )}
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 hover-scale">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold">Transfer Fee</span>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg">
                    <Coins className="w-5 h-5" />
                    <span>{pivotPointsFee} PP</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Fee: 10 Pivot Points per GB • Instant transfer
                  </p>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Remaining after transfer: {(userDataBalance - dataAmount[0]).toFixed(1)} GB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold hover-lift"
            size="lg"
            onClick={handleTransfer}
            disabled={!isFormValid || isSubmitting}
          >
            <Send className="w-5 h-5 mr-2" />
            Send {dataAmount[0]} GB Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirm Transfer</DialogTitle>
            <DialogDescription className="text-base">
              Please review the transfer details before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-semibold text-base">{recipientInfo?.name}</p>
                <Badge variant="secondary" className="font-mono text-xs mt-1">
                  {recipientInfo?.udi || recipientInfo?.email}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data Amount</p>
                <p className="font-semibold text-base">{dataAmount[0]} GB</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transfer Fee</p>
                <p className="font-semibold text-base text-blue-600 dark:text-blue-400">{pivotPointsFee} PP</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Your New Balance</p>
                <p className="font-semibold text-base">{(userDataBalance - dataAmount[0]).toFixed(1)} GB</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="hover-scale"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClick}
              className="hover-scale"
            >
              Continue to PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="animate-scale-in max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Enter PIN</DialogTitle>
            <DialogDescription className="text-base">
              Enter your 4-digit PIN to confirm this transfer
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="pin" className="text-base font-semibold">4-Digit PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className={cn(
                  "h-14 text-center text-2xl tracking-widest font-bold",
                  pinError && "border-destructive focus-visible:ring-destructive animate-shake"
                )}
                autoFocus
              />
              {pinError && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pinError}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Demo PIN: 1234
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPin('');
                setPinError('');
              }}
              disabled={isSubmitting}
              className="hover-scale"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTransfer}
              disabled={isSubmitting || pin.length !== 4}
              className="hover-scale"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QrScanner
        open={showQrScanner}
        onOpenChange={setShowQrScanner}
        onScanSuccess={handleQrScanSuccess}
        title="Scan Receiver QR"
        description="Point your camera at the receiver's QR code."
        userPhone={session?.user?.phoneNumber}
        userUdi={session?.user?.udi}
      />

      <Dialog open={transferSuccess} onOpenChange={setTransferSuccess}>
        <DialogContent className="animate-scale-in">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6 animate-check">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-3xl mb-3">Transfer Successful!</DialogTitle>
            <DialogDescription className="text-lg">
              {dataAmount[0]} GB has been sent to {recipientInfo?.name}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
