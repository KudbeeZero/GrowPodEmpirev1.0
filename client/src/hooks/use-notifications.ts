import { useState, useEffect, useCallback } from 'react';

export interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;
    setState({
      permission: isSupported ? Notification.permission : 'denied',
      isSupported,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch {
      return false;
    }
  }, [state.isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') return null;
    
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch {
      return null;
    }
  }, [state.isSupported, state.permission]);

  const scheduleNotification = useCallback((
    title: string, 
    options: NotificationOptions, 
    delayMs: number
  ): NodeJS.Timeout | null => {
    if (!state.isSupported || state.permission !== 'granted') return null;
    
    const timeoutId = setTimeout(() => {
      sendNotification(title, options);
    }, delayMs);
    
    return timeoutId;
  }, [state.isSupported, state.permission, sendNotification]);

  return {
    ...state,
    requestPermission,
    sendNotification,
    scheduleNotification,
  };
}

export function usePlantNotifications(
  pods: Array<{ id: number; status: string; waterCooldownRemaining: number; canWater: boolean }>,
  isConnected: boolean
) {
  const { permission, isSupported, scheduleNotification } = useNotifications();
  const [scheduledNotifications, setScheduledNotifications] = useState<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!isConnected || !isSupported || permission !== 'granted') return;

    scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    const newScheduled = new Map<number, NodeJS.Timeout>();

    pods.forEach(pod => {
      if (pod.status !== 'empty' && pod.status !== 'needs_cleanup' && pod.waterCooldownRemaining > 0) {
        const delayMs = pod.waterCooldownRemaining * 1000;
        
        if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
          const timeoutId = scheduleNotification(
            `Pod #${pod.id} needs water!`,
            { 
              body: 'Your plant is thirsty. Water it now to keep growing!',
              tag: `water-${pod.id}`,
            },
            delayMs
          );
          
          if (timeoutId) {
            newScheduled.set(pod.id, timeoutId);
          }
        }
      }
    });

    setScheduledNotifications(newScheduled);

    return () => {
      newScheduled.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [pods, isConnected, isSupported, permission, scheduleNotification]);

  return { scheduledCount: scheduledNotifications.size };
}
