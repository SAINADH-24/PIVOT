"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
        primaryText: "$9.99/month",
        secondaryText: "billed monthly",
      },
    },
    {
      id: "pro",
      description: "Advanced features for power users and heavy data users",
      recommendText: "Most Popular",
      price: {
        primaryText: "$24.99/month",
        secondaryText: "billed monthly",
      },
    },
    {
      id: "unlimited",
      description: "Everything you need for unlimited data transfers",
      price: {
        primaryText: "$49.99/month",
        secondaryText: "billed monthly",
      },
    },
  ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 animate-fade-in-up">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/')}
              className="hover-scale"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Choose Your Plan
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upgrade your P!VOT experience with more data transfers, Pivot Points, and premium features
              </p>
            </div>
          </div>

        {/* Pricing Table */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <PricingTable productDetails={productDetails} />
        </div>

        {/* Features Comparison */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground">
            All plans include core P!VOT features. Higher tiers unlock more data transfers and advanced capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
