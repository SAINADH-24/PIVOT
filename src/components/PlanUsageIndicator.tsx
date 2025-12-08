"use client";

import React from 'react';
import { useCustomer } from 'autumn-js/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function PlanUsageIndicator() {
  const { customer, isLoading } = useCustomer();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!customer) return null;

  const planName = customer?.products?.at(-1)?.name || "Free Plan";
  const features = Object.values(customer?.features || {});

  return (
    <Card className="premium-card hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Plan</CardTitle>
          <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white">
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No metered features in your plan</p>
        ) : (
          features.map((feature: any) => {
            const hasLimit = typeof feature.included_usage === 'number';
            const usage = feature.usage || 0;
            const limit = feature.included_usage;
            const percentage = hasLimit && limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;
            const isUnlimited = !hasLimit || feature.unlimited;

            // Map feature IDs to readable names
            const featureNames: Record<string, string> = {
              'data_transfers': 'Data Transfers',
              'pivot_points': 'Pivot Points',
              'udi_devices': 'UDI Devices',
            };
            
            const displayName = featureNames[feature.feature_id] || feature.feature_id;

            return (
              <div key={feature.feature_id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-muted-foreground">{displayName}</span>
                  {isUnlimited ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                      Unlimited
                    </Badge>
                  ) : (
                    <span className="font-mono text-xs font-semibold">
                      {usage}{hasLimit ? `/${limit}` : ' used'}
                    </span>
                  )}
                </div>
                
                {!isUnlimited && hasLimit && (
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-500",
                        percentage > 90 ? "bg-destructive" : 
                        percentage > 75 ? "bg-yellow-500" : 
                        "bg-gradient-to-r from-violet-500 to-purple-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
        
        <Button 
          onClick={() => router.push('/pricing')}
          variant="outline"
          className="w-full mt-4 group hover-scale"
        >
          Manage Plan
          <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
