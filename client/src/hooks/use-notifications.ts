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

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MAX_SCHEDULE_TIME = 24 * 60 * 60 * 1000;

export function usePlantNotifications(
  pods: Array<{ 
    id: number; 
    status: string; 
    waterCooldownRemaining: number; 
    nutrientCooldownRemaining: number;
    canWater: boolean;
    canAddNutrients: boolean;
  }>,
  isConnected: boolean
) {
  const { permission, isSupported, scheduleNotification } = useNotifications();
  const [scheduledNotifications, setScheduledNotifications] = useState<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!isConnected || !isSupported || permission !== 'granted') return;

    scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    const newScheduled = new Map<string, NodeJS.Timeout>();

    pods.forEach(pod => {
      if (pod.status === 'empty' || pod.status === 'needs_cleanup') return;

      const waterDelayMs = pod.waterCooldownRemaining * 1000;
      if (waterDelayMs > 0 && waterDelayMs < MAX_SCHEDULE_TIME) {
        const waterReadyId = scheduleNotification(
          `Pod #${pod.id} needs water!`,
          { 
            body: 'Your plant is thirsty. Water it now to keep growing!',
            tag: `water-ready-${pod.id}`,
          },
          waterDelayMs
        );
        if (waterReadyId) newScheduled.set(`water-ready-${pod.id}`, waterReadyId);

        const waterReminderDelayMs = waterDelayMs - THIRTY_MINUTES_MS;
        if (waterReminderDelayMs > 0) {
          const waterReminderId = scheduleNotification(
            `Pod #${pod.id} water in 30 min`,
            { 
              body: 'Get ready! Your plant will need water soon.',
              tag: `water-reminder-${pod.id}`,
            },
            waterReminderDelayMs
          );
          if (waterReminderId) newScheduled.set(`water-reminder-${pod.id}`, waterReminderId);
        }
      }

      const nutrientDelayMs = pod.nutrientCooldownRemaining * 1000;
      if (nutrientDelayMs > 0 && nutrientDelayMs < MAX_SCHEDULE_TIME) {
        const nutrientReadyId = scheduleNotification(
          `Pod #${pod.id} ready for nutrients!`,
          { 
            body: 'Your plant can receive nutrients now for bonus yield!',
            tag: `nutrient-ready-${pod.id}`,
          },
          nutrientDelayMs
        );
        if (nutrientReadyId) newScheduled.set(`nutrient-ready-${pod.id}`, nutrientReadyId);

        const nutrientReminderDelayMs = nutrientDelayMs - THIRTY_MINUTES_MS;
        if (nutrientReminderDelayMs > 0) {
          const nutrientReminderId = scheduleNotification(
            `Pod #${pod.id} nutrients in 30 min`,
            { 
              body: 'Get ready! Your plant will be ready for nutrients soon.',
              tag: `nutrient-reminder-${pod.id}`,
            },
            nutrientReminderDelayMs
          );
          if (nutrientReminderId) newScheduled.set(`nutrient-reminder-${pod.id}`, nutrientReminderId);
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
