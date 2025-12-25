"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Database, 
  Coins, 
  Search, 
  RefreshCw, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function AdminPanel() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRecharge = async (userId: string, dataAmount: number, pivotPoints: number) => {
    setRechargeLoading(userId);
    try {
      const response = await fetch('/api/admin/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, dataAmount, pivotPoints })
      });

      if (!response.ok) throw new Error('Recharge failed');
      
      toast.success('Recharge successful');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to recharge user');
    } finally {
      setRechargeLoading(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.udi && user.udi.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if ((session?.user as any)?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
        <ShieldAlert className="w-20 h-20 text-destructive mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          This area is reserved for P!VOT administrators only. Please contact support if you believe this is an error.
        </p>
        <Button className="mt-8 shadow-xl" variant="default" onClick={() => window.location.href = '/'}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Management Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Manage platform users, balances, and system health.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchUsers} 
          disabled={loading}
          className="shadow-sm hover-lift"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Total Users
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="premium-card bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/20 dark:to-background border-sky-200/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" />
              Total Data Allocated
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {users.reduce((acc, user) => acc + (user.dataBalance || 0), 0).toFixed(1)} GB
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="premium-card bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-200/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-500" />
              Total Pivot Points
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {users.reduce((acc, user) => acc + (user.pivotPoints || 0), 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="premium-card shadow-xl border-none ring-1 ring-black/5 dark:ring-white/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Monitor and recharge balances for all registered users.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by email, name or UDI..." 
                className="pl-10 bg-muted/50 border-none shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Fetching users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="py-4 px-4 font-semibold">User Details</th>
                    <th className="py-4 px-4 font-semibold text-center">Balances</th>
                    <th className="py-4 px-4 font-semibold text-right">Quick Recharge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user.name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.udi && (
                              <Badge variant="outline" className="mt-1 text-[10px] h-4 py-0 font-mono">
                                UDI: {user.udi}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{(user.dataBalance || 0).toFixed(1)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">GB Data</p>
                          </div>
                          <div className="w-px h-8 bg-muted"></div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-indigo-600">{(user.pivotPoints || 0).toLocaleString()}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Points</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-8 text-xs hover-lift shadow-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
                            onClick={() => handleRecharge(user.id, 5, 100)}
                            disabled={rechargeLoading === user.id}
                          >
                            {rechargeLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                            +5GB
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-8 text-xs hover-lift shadow-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300"
                            onClick={() => handleRecharge(user.id, 0, 500)}
                            disabled={rechargeLoading === user.id}
                          >
                            {rechargeLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                            +500 PP
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-20 text-center text-muted-foreground">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
