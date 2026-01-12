"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Download, Filter, CheckCircle, Clock, XCircle, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/useUserData';

interface HistoryPageProps {
  onNavigate: (page: string) => void;
}

interface TransactionRecord {
  id: string | number;
  type: 'transfer' | 'recharge' | 'sent' | 'received';
  amount: number;
  recipient?: string;
  sender?: string;
  network?: string;
  fee: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { transfers, loading, error } = useUserData();
  const [searchQuery, setSearchQuery] = useState('');

  const transactions: TransactionRecord[] = transfers.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    recipient: t.type === 'sent' ? `Receiver ID: ${t.receiverId.substring(0, 8)}...` : undefined,
    sender: t.type === 'received' ? `Sender ID: ${t.senderId.substring(0, 8)}...` : undefined,
    fee: t.fee,
    date: t.createdAt,
    status: t.status as any || 'completed'
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const allTransfers = transactions.filter(t => t.type === 'sent' || t.type === 'received');
  const allRecharges = transactions.filter(t => t.type === 'recharge');

  const filteredTransactions = transactions.filter(t => 
    !searchQuery || 
    t.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.network?.toLowerCase().includes(searchQuery.toLowerCase())
  );

    const TransactionCard = ({ transaction, index }: { transaction: TransactionRecord; index: number }) => {
      const StatusIcon = getStatusIcon(transaction.status);
      const isSent = transaction.type === 'sent';
      const isReceived = transaction.type === 'received';

      return (
        <div 
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer group stagger-item",
            isSent 
              ? "bg-violet-50 dark:bg-violet-950/10 border-violet-200 dark:border-violet-900 hover:border-violet-300 dark:hover:border-violet-800" 
              : "bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-800"
          )}
        >
          <div className="flex items-center gap-4 flex-1 mb-4 sm:mb-0">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110",
              isSent 
                ? 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30' 
                : 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
            )}>
              {isSent ? (
                <Send className="w-7 h-7 text-violet-600 dark:text-violet-400" />
              ) : (
                <Download className="w-7 h-7 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-bold text-base capitalize">{transaction.type === 'sent' ? 'Data Sent' : 'Data Received'}</p>
                <Badge variant="secondary" className={cn("animate-scale-in", getStatusColor(transaction.status))}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {transaction.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {transaction.recipient && (
                  <span className="font-medium text-violet-600 dark:text-violet-400">{transaction.recipient} • </span>
                )}
                {transaction.sender && (
                  <span className="font-medium text-green-600 dark:text-green-400">{transaction.sender} • </span>
                )}
                <span>{new Date(transaction.date).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "font-bold text-2xl bg-gradient-to-r bg-clip-text text-transparent",
              isSent ? "from-violet-600 to-fuchsia-600" : "from-green-600 to-emerald-600"
            )}>
              {isSent ? '-' : '+'}{transaction.amount} GB
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {isSent ? 'Fee' : 'Points'}: {transaction.fee} PP
            </p>
          </div>
        </div>
      );
    };

    if (loading && transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onNavigate('dashboard')}
            className="hover-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">View all your transfers and recharges</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Card className="premium-card hover-lift bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Transactions</p>
                <p className="text-3xl font-bold">{transactions.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg flex items-center justify-center hover-scale">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card hover-lift bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Data Transferred</p>
                <p className="text-3xl font-bold">{transfers.reduce((acc, t) => acc + t.amount, 0).toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg flex items-center justify-center hover-scale">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="premium-card hover-lift bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Recharges</p>
                <p className="text-3xl font-bold">{recharges.reduce((acc, t) => acc + t.amount, 0).toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg flex items-center justify-center hover-scale">
                <Download className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Tabs defaultValue="all" className="w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="all" className="text-base">All</TabsTrigger>
          <TabsTrigger value="transfers" className="text-base">Transfers</TabsTrigger>
          <TabsTrigger value="recharges" className="text-base">Recharges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete history of your activities</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction, index) => (
                    <TransactionCard key={transaction.id} transaction={transaction} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers" className="space-y-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Data Transfers</CardTitle>
              <CardDescription>Peer-to-peer data transfer history</CardDescription>
            </CardHeader>
            <CardContent>
              {transfers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No transfers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transfers.map((transaction, index) => (
                    <TransactionCard key={transaction.id} transaction={transaction} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recharges" className="space-y-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Recharge History</CardTitle>
              <CardDescription>Your plan activations and purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {recharges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Download className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No recharges yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recharges.map((transaction, index) => (
                    <TransactionCard key={transaction.id} transaction={transaction} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}