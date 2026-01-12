"use client";

import { useEffect, useCallback, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/user-notifications?unreadOnly=true');
      const data = await response.json();

      if (data.notifications && data.notifications.length > 0) {
        const newNotifications = data.notifications.filter(
          (n: Notification) => !notifications.some(existing => existing.id === n.id)
        );

        for (const notification of newNotifications) {
          const isDataReceived = notification.type === 'data_received';
          
          toast(notification.title, {
            description: notification.message,
            duration: isDataReceived ? 15000 : 10000,
            action: {
              label: 'Dismiss',
              onClick: () => markAsRead(notification.id)
            },
            style: isDataReceived ? {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
            } : undefined,
          });

          await markAsRead(notification.id);
        }

        setNotifications(data.notifications);
        setUnreadCount(data.notifications.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [session?.user, notifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/user-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/user-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, [session?.user]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
