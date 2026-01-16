"use client";

import React from 'react';
import { ArrowLeft, Zap, Shield, Sparkles, Crown, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PricingTable from '@/components/autumn/pricing-table';
import { useRouter } from 'next/navigation';

export function PricingPage() {
  const router = useRouter();

  const productDetails = [
    {
      id: "free",
      description: "Perfect for trying out P!VOT data transfer features",
    },
    {
      id: "starter",
      description: "Great for regular users who need more data flexibility",
      price: {
        primaryText: "₹799/month",
        secondaryText: "billed monthly",
      },
    },
    {
      id: "pro",
      description: "Advanced features for power users and heavy data users",
      recommendText: "Most Popular",
      price: {
        primaryText: "₹1,999/month",
        secondaryText: "billed monthly",
      },
    },
    {
      id: "unlimited",
      description: "Everything you need for unlimited data transfers",
      price: {
        primaryText: "₹3,999/month",
        secondaryText: "billed monthly",
      },
    },
  ];

  const highlights = [
    { icon: Zap, text: "Lightning Fast Transfers", color: "text-yellow-500" },
    { icon: Shield, text: "Secure & Encrypted", color: "text-green-500" },
    { icon: Sparkles, text: "Premium Features", color: "text-purple-500" },
    { icon: Crown, text: "Priority Support", color: "text-orange-500" },
  ];

  const guarantees = [
    "7-day money back guarantee",
    "Cancel anytime, no questions asked",
    "Instant activation after payment",
    "24/7 customer support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="flex items-center gap-4 animate-fade-in-up">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="hover:scale-110 transition-transform duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full border border-blue-200/50 dark:border-blue-700/50 mb-4">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Special Launch Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upgrade your P!VOT experience with more data transfers, Pivot Points, and premium features
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          {highlights.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
            <PricingTable productDetails={productDetails} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 md:p-8 border border-green-200/50 dark:border-green-700/50 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-xl font-semibold text-center mb-6 text-green-800 dark:text-green-300">
            Our Promise to You
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{guarantee}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center animate-fade-in-up space-y-4" style={{ animationDelay: '0.2s' }}>
          <p className="text-muted-foreground">
            All plans include core P!VOT features. Higher tiers unlock more data transfers and advanced capabilities.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Prices shown in Indian Rupees (INR). Taxes may apply based on your location.
          </p>
        </div>
      </div>
    </div>
  );
}
