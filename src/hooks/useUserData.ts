"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/lib/auth-client';

interface UserData {
  dataBalance: number;
  pivotPoints: number;
  name: string;
  email: string;
  udi: string | null;
}

interface Transfer {
  id: number;
  senderId: string;
  receiverId: string;
  amount: number;
  fee: number;
  status: string;
  createdAt: string;
  type: 'sent' | 'received';
}

interface UserDataResponse {
  user: UserData;
  transfers: Transfer[];
  unreadNotifications: number;
  error?: string;
}

export function useUserData(pollingInterval = 5000) {
  const { data: session } = useSession();
  const [data, setData] = useState<UserDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/user/data');
      if (!response.ok) throw new Error('Failed to fetch user data');
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Error polling user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
      
      pollingTimerRef.current = setInterval(fetchData, pollingInterval);
    } else {
      setData(null);
      setLoading(false);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [session?.user, fetchData, pollingInterval]);

  return {
    userData: data?.user || null,
    transfers: data?.transfers || [],
    unreadNotifications: data?.unreadNotifications || 0,
    loading,
    error,
    refresh: fetchData
  };
}
