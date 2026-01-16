"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Coins, ArrowRight, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    totalPoints: number;
    packageLabel: string;
    bonusPoints: number;
  } | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/?page=wallet');
      return;
    }

    const timer = setTimeout(() => {
      setSessionData({
        totalPoints: 0,
        packageLabel: '',
        bonusPoints: 0,
      });
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  const handleContinue = () => {
    router.push('/?page=wallet');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Processing Payment</h2>
            <p className="text-slate-400">Please wait while we confirm your purchase...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10" />
        <CardContent className="relative p-8 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-400 mb-6">Your Pivot Points have been added to your wallet</p>
          
          <div className="w-full bg-slate-800/50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-amber-500" />
              <span className="text-3xl font-bold text-white">Points Added</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your balance has been updated
            </p>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-6"
          >
            Go to Wallet
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
