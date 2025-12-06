"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Coins, CheckCircle2, ArrowLeft, AlertCircle, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QrScanner } from '@/components/QrScanner';

interface SendDataPageProps {
  onNavigate: (page: string) => void;
}

interface ValidationErrors {
  phone?: string;
  network?: string;
  amount?: string;
}

// QR Code parsing helper functions
function parseQrCodeData(qrData: string): { phone?: string; udi?: string; network?: string } {
  try {
    // Try parsing as JSON first
    const jsonData = JSON.parse(qrData);
    return {
      phone: jsonData.phone || jsonData.number || jsonData.phoneNumber,
      udi: jsonData.udi || jsonData.id || jsonData.udiId,
      network: jsonData.network || jsonData.provider
    };
  } catch {
    // Not JSON, try other formats
    
    // Format: phone:+1234567890,udi:@user-phone,network:Jio
    if (qrData.includes(':') && qrData.includes(',')) {
      const result: { phone?: string; udi?: string; network?: string } = {};
      const parts = qrData.split(',');
      
      parts.forEach(part => {
        const [key, value] = part.split(':');
        const normalizedKey = key.trim().toLowerCase();
        
        if (normalizedKey === 'phone' || normalizedKey === 'number') {
          result.phone = value.trim();
        } else if (normalizedKey === 'udi' || normalizedKey === 'id') {
          result.udi = value.trim();
        } else if (normalizedKey === 'network' || normalizedKey === 'provider') {
          result.network = value.trim();
        }
      });
      
      return result;
    }
    
    // Plain phone number detection
    const phoneRegex = /^\+?\d{10,15}$/;
    if (phoneRegex.test(qrData.trim())) {
      return { phone: qrData.trim() };
    }
    
    // UDI handle detection (starts with @)
    if (qrData.trim().startsWith('@')) {
      return { udi: qrData.trim() };
    }
    
    // URL format: pivotapp://send?phone=+1234567890&udi=@user&network=Jio
    if (qrData.includes('pivotapp://') || qrData.includes('https://')) {
      try {
        const url = new URL(qrData.replace('pivotapp://', 'https://'));
        const params = new URLSearchParams(url.search);
        
        return {
          phone: params.get('phone') || params.get('number') || undefined,
          udi: params.get('udi') || params.get('id') || undefined,
          network: params.get('network') || params.get('provider') || undefined
        };
      } catch {
        // Invalid URL format
      }
    }
    
    return {};
  }
}

function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

export function SendDataPage({ onNavigate }: SendDataPageProps) {
  const { user, updateUser } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientUdi, setRecipientUdi] = useState('');
  const [network, setNetwork] = useState('');
  const [dataAmount, setDataAmount] = useState([1]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ phone: false, network: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock PIN stored in state (in production, this would be securely stored)
  const MOCK_PIN = '1234';

  const networks = ['Airtel', 'Jio', 'Vi', 'BSNL'];
  
  // Calculate pivot points fee (10 points per GB)
  const pivotPointsFee = dataAmount[0] * 10;
  
  // Validation functions
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'Phone number is required';
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      return 'Invalid phone number format (10-15 digits)';
    }
    return undefined;
  };

  const validateNetwork = (net: string): string | undefined => {
    if (!net) return 'Network provider is required';
    return undefined;
  };

  const validateAmount = (amount: number): string | undefined => {
    if (amount <= 0) return 'Amount must be greater than 0';
    if (!user) return 'User not found';
    if (amount > user.dataBalance) {
      return `Insufficient data balance (Available: ${user.dataBalance.toFixed(1)} GB)`;
    }
    if (pivotPointsFee > user.pivotPoints) {
      return `Insufficient Pivot Points (Required: ${pivotPointsFee} PP, Available: ${user.pivotPoints} PP)`;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      phone: validatePhone(recipientPhone),
      network: validateNetwork(network),
      amount: validateAmount(dataAmount[0])
    };
    setErrors(newErrors);
    return !newErrors.phone && !newErrors.network && !newErrors.amount;
  };

  const handlePhoneChange = (value: string) => {
    setRecipientPhone(value);
    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  const handleNetworkChange = (value: string) => {
    setNetwork(value);
    if (touched.network) {
      setErrors(prev => ({ ...prev, network: validateNetwork(value) }));
    }
  };

  const handleAmountChange = (value: number[]) => {
    setDataAmount(value);
    setErrors(prev => ({ ...prev, amount: validateAmount(value[0]) }));
  };

  const handleTransfer = () => {
    setTouched({ phone: true, network: true });
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
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
    // Only allow digits and max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setPinError('');
  };

  const confirmTransfer = async () => {
    if (!user) return;
    
    // Validate PIN
    if (pin !== MOCK_PIN) {
      setPinError('Invalid PIN. Please try again.');
      setPin('');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update user data
    updateUser({
      dataBalance: user.dataBalance - dataAmount[0],
      pivotPoints: user.pivotPoints - pivotPointsFee
    });

    setShowPinDialog(false);
    setTransferSuccess(true);

    // Record transaction in localStorage
    const transactions = JSON.parse(localStorage.getItem('pivot_transactions') || '[]');
    transactions.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'Data Transfer - Sent',
      amount: dataAmount[0],
      recipient: recipientPhone,
      recipientUdi: recipientUdi || undefined,
      network: network,
      fee: pivotPointsFee,
      date: new Date().toISOString(),
      status: 'completed'
    });
    localStorage.setItem('pivot_transactions', JSON.stringify(transactions));

    toast.success(`Data transfer successful! ${dataAmount[0]} GB sent to ${recipientPhone}`);

    // Reset form after delay
    setTimeout(() => {
      setTransferSuccess(false);
      setRecipientPhone('');
      setRecipientUdi('');
      setNetwork('');
      setDataAmount([1]);
      setErrors({});
      setTouched({ phone: false, network: false });
      setIsSubmitting(false);
      setPin('');
    }, 2000);
  };

  const handleScanQr = () => {
    setShowQrScanner(true);
  };

  const handleQrScanSuccess = (decodedText: string, decodedResult: any) => {
    const parsed = parseQrCodeData(decodedText);
    
    let updated = false;
    
    // Autofill phone number
    if (parsed.phone && validatePhoneNumber(parsed.phone)) {
      setRecipientPhone(parsed.phone);
      updated = true;
    }
    
    // Autofill UDI
    if (parsed.udi) {
      setRecipientUdi(parsed.udi);
      updated = true;
    }
    
    // Autofill network
    if (parsed.network && networks.includes(parsed.network)) {
      setNetwork(parsed.network);
      updated = true;
    }
    
    if (updated) {
      const details = [];
      if (parsed.phone) details.push(parsed.phone);
      if (parsed.udi) details.push(parsed.udi);
      if (parsed.network) details.push(parsed.network);
      
      toast.success(`Scanned: ${details.join(' • ')} — filled into recipient`);
      
      // Clear errors
      setErrors({});
      setTouched({ phone: false, network: false });
    } else {
      toast.error('Could not extract valid data from QR code');
    }
    
    setShowQrScanner(false);
  };

  const isFormValid = !errors.phone && !errors.network && !errors.amount && recipientPhone && network;

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
          <CardDescription>Send mobile data instantly using Pivot Points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="grid grid-cols-2 gap-4 p-5 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border border-violet-100 dark:border-violet-900">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Available Data</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {user?.dataBalance.toFixed(1)} GB
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Pivot Points</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {user?.pivotPoints.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-base font-semibold">
                Recipient Phone Number / UDI *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="recipient"
                  type="tel"
                  placeholder="+1 234 567 8900 or @user-udi"
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                  className={cn(
                    "h-12 text-base transition-all flex-1",
                    errors.phone && touched.phone && "border-destructive focus-visible:ring-destructive animate-shake"
                  )}
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
              {errors.phone && touched.phone && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.phone}</span>
                </div>
              )}
              {recipientUdi && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {recipientUdi}
                  </Badge>
                  <span className="text-xs text-muted-foreground">UDI Identifier</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="network" className="text-base font-semibold">
                Network Provider *
              </Label>
              <Select value={network} onValueChange={handleNetworkChange}>
                <SelectTrigger 
                  id="network"
                  className={cn(
                    "h-12 text-base transition-all",
                    errors.network && touched.network && "border-destructive focus-visible:ring-destructive"
                  )}
                  onBlur={() => setTouched(prev => ({ ...prev, network: true }))}
                >
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((net) => (
                    <SelectItem key={net} value={net} className="text-base">
                      {net}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.network && touched.network && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.network}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Data Amount (GB) *</Label>
                <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                  {dataAmount[0]} GB
                </Badge>
              </div>
              <Slider
                value={dataAmount}
                onValueChange={handleAmountChange}
                min={0.5}
                max={Math.min(10, user?.dataBalance || 10)}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0.5 GB</span>
                <span>{Math.min(10, user?.dataBalance || 10)} GB</span>
              </div>
              {errors.amount && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.amount}</span>
                </div>
              )}
            </div>

            {/* Fee Calculation */}
            <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border-violet-200 dark:border-violet-800 hover-scale">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold">Transfer Fee</span>
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-lg">
                    <Coins className="w-5 h-5" />
                    <span>{pivotPointsFee} PP</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Fee: 10 Pivot Points per GB • Instant transfer
                  </p>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    Remaining after transfer: {user ? (user.dataBalance - dataAmount[0]).toFixed(1) : 0} GB
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

      {/* Confirmation Dialog */}
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
                <p className="font-semibold text-base">{recipientPhone}</p>
                {recipientUdi && (
                  <Badge variant="secondary" className="font-mono text-xs mt-1">
                    {recipientUdi}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-semibold text-base">{network}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data Amount</p>
                <p className="font-semibold text-base">{dataAmount[0]} GB</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transfer Fee</p>
                <p className="font-semibold text-base text-violet-600 dark:text-violet-400">{pivotPointsFee} PP</p>
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

      {/* PIN Confirmation Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="animate-scale-in max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirm Transfer</DialogTitle>
            <DialogDescription className="text-base">
              Enter your 4-digit PIN to confirm this data transfer
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="pin" className="text-base font-semibold">4-Digit PIN *</Label>
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

      {/* QR Scanner Dialog */}
      <QrScanner
        open={showQrScanner}
        onOpenChange={setShowQrScanner}
        onScanSuccess={handleQrScanSuccess}
        title="Scan Receiver QR"
        description="Point your camera at the receiver's QR code or upload an image."
      />

      {/* Success Dialog */}
      <Dialog open={transferSuccess} onOpenChange={setTransferSuccess}>
        <DialogContent className="animate-scale-in">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6 animate-check">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-3xl mb-3">Transfer Successful!</DialogTitle>
            <DialogDescription className="text-lg">
              {dataAmount[0]} GB has been sent to {recipientPhone}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}