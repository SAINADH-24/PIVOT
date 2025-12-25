"use client";

import { useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { data: session } = useSession();

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          // Show popup/toast
          toast(notification.title, {
            description: notification.message,
            duration: 10000, // Show for 10 seconds
            action: {
              label: 'Mark as Read',
              onClick: () => markAsRead(notification.id)
            },
          });

          // Mark as read immediately or let user click? 
          // User said "by giving an popup", so we show the popup.
          // For now, let's mark it as read so it doesn't pop up again on next poll.
          await markAsRead(notification.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [session?.user]);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch
    fetchNotifications();

    // Poll every 5 seconds for "real-time" feel
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, [session?.user, fetchNotifications]);
}
