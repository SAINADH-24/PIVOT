"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Download, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HistoryPageProps {
  onNavigate: (page: string) => void;
}

interface TransactionRecord {
  id: string;
  type: 'transfer' | 'recharge';
  amount: number;
  recipient?: string;
  network?: string;
  fee: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    // Load transactions from localStorage
    const stored = localStorage.getItem('pivot_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    } else {
      // Mock data
      setTransactions([
        {
          id: '1',
          type: 'transfer',
          amount: 2.5,
          recipient: '+1 234 567 8900',
          network: 'Airtel',
          fee: 25,
          date: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          type: 'recharge',
          amount: 10,
          fee: 100,
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'transfer',
          amount: 1.5,
          recipient: '+1 987 654 3210',
          network: 'Jio',
          fee: 15,
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed'
        }
      ]);
    }
  }, []);

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

  const transfers = transactions.filter(t => t.type === 'transfer');
  const recharges = transactions.filter(t => t.type === 'recharge');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">View all your transfers and recharges</p>
          </div>
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data Transferred</p>
                <p className="text-2xl font-bold">{transfers.reduce((acc, t) => acc + t.amount, 0).toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Recharges</p>
                <p className="text-2xl font-bold">{recharges.reduce((acc, t) => acc + t.amount, 0).toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="recharges">Recharges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete history of your activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const StatusIcon = getStatusIcon(transaction.status);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl ${
                          transaction.type === 'transfer' 
                            ? 'bg-violet-100 dark:bg-violet-900/20' 
                            : 'bg-green-100 dark:bg-green-900/20'
                        } flex items-center justify-center`}>
                          {transaction.type === 'transfer' ? (
                            <Send className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          ) : (
                            <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold capitalize">{transaction.type}</p>
                            <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.type === 'transfer' && transaction.recipient && (
                              <span>{transaction.recipient} • {transaction.network} • </span>
                            )}
                            <span>{new Date(transaction.date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{transaction.amount} GB</p>
                        <p className="text-xs text-muted-foreground">Fee: {transaction.fee} PP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Transfers</CardTitle>
              <CardDescription>Peer-to-peer data transfer history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfers.map((transaction) => {
                  const StatusIcon = getStatusIcon(transaction.status);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                          <Send className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{transaction.recipient}</p>
                            <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {transaction.network} • {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{transaction.amount} GB</p>
                        <p className="text-xs text-muted-foreground">Fee: {transaction.fee} PP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recharges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recharge History</CardTitle>
              <CardDescription>Your plan activations and purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recharges.map((transaction) => {
                  const StatusIcon = getStatusIcon(transaction.status);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">Custom Recharge Plan</p>
                            <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{transaction.amount} GB</p>
                        <p className="text-xs text-muted-foreground">Points: +{transaction.fee} PP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
