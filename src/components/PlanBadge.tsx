"use client";

import React from 'react';
import { useCustomer } from 'autumn-js/react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PlanBadge() {
  const { customer, isLoading } = useCustomer();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="px-3 py-1.5 rounded-full bg-muted animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) return null;

  const currentPlan = customer?.products?.at(-1);
  const planName = currentPlan?.name || "Free";
  const isPremium = planName !== "Free" && planName !== "Free Plan";

  return (
    <button
      onClick={() => router.push('/pricing')}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all hover-scale cursor-pointer group",
        isPremium
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md hover:shadow-lg"
          : "bg-secondary text-foreground border hover:bg-accent"
      )}
      title="Click to manage your plan"
    >
      {isPremium && (
        <Crown className="w-3 h-3" />
      )}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      <span>{planName}</span>
    </button>
  );
}
