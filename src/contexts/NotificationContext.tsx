import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// Define notification settings interface
export interface NotificationSettings {
  id: string;
  user_id: string;
  new_leads: boolean;
  new_bookings: boolean;
  payment_receipts: boolean;
  tour_reminders: boolean;
  marketing_emails: boolean;
  push_leads: boolean;
  push_bookings: boolean;
  push_payments: boolean;
}

// Define notification type for displaying notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lead' | 'booking' | 'payment' | 'reminder' | 'marketing' | 'system';
  read: boolean;
  created_at: string;
}

// Define context type
interface NotificationContextType {
  notificationSettings: NotificationSettings | null;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotificationSettings: () => Promise<void>;
  saveNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  shouldNotify: (type: keyof NotificationSettings) => boolean;
  sendNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const defaultSettings = {
            user_id: currentUser.id,
            new_leads: true,
            new_bookings: true,
            payment_receipts: true,
            tour_reminders: true,
            marketing_emails: false,
            push_leads: true,
            push_bookings: true,
            push_payments: true
          };
          
          const { data: newData, error: insertError } = await supabase
            .from('notification_settings')
            .insert(defaultSettings)
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating default notification settings:', insertError);
          } else {
            setNotificationSettings(newData);
          }
        } else {
          console.error('Error fetching notification settings:', error);
        }
      } else if (data) {
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error('Error in fetchNotificationSettings:', error);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!currentUser?.id || !notificationSettings) return false;
    
    try {
      const updatedSettings = {
        ...notificationSettings,
        ...settings
      };
      
      const { error } = await supabase
        .from('notification_settings')
        .update(updatedSettings)
        .eq('id', notificationSettings.id);
      
      if (error) {
        console.error('Error saving notification settings:', error);
        return false;
      }
      
      setNotificationSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Error in saveNotificationSettings:', error);
      return false;
    }
  };

  // Fetch user's notifications
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  // Check if user should be notified for a specific type
  const shouldNotify = (type: keyof NotificationSettings): boolean => {
    if (!notificationSettings) return false;
    return !!notificationSettings[type];
  };

  // Send a new notification
  const sendNotification = async (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    if (!currentUser?.id) return;
    
    try {
      // Check if user wants to receive this type of notification
      const notificationType = mapNotificationTypeToSetting(notification.type);
      if (!shouldNotify(notificationType)) return;
      
      // Insert notification into database
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: currentUser.id,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error sending notification:', error);
      } else if (data) {
        // Add to local state
        setNotifications(prev => [data, ...prev]);
        
        // Show toast notification if it's a push notification
        const pushType = `push_${notificationType.replace('new_', '')}` as keyof NotificationSettings;
        if (shouldNotify(pushType)) {
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  };

  // Helper to map notification type to setting name
  const mapNotificationTypeToSetting = (type: Notification['type']): keyof NotificationSettings => {
    switch (type) {
      case 'lead': return 'new_leads';
      case 'booking': return 'new_bookings';
      case 'payment': return 'payment_receipts';
      case 'reminder': return 'tour_reminders';
      case 'marketing': return 'marketing_emails';
      case 'system': return 'new_bookings'; // Default to bookings for system notifications
      default: return 'new_bookings';
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotificationSettings();
      await fetchNotifications();
      setLoading(false);
    };
    
    if (currentUser?.id) {
      loadData();
    } else {
      setNotificationSettings(null);
      setNotifications([]);
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        // Add to local state
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for push notifications
        const notificationType = mapNotificationTypeToSetting(newNotification.type);
        const pushType = `push_${notificationType.replace('new_', '')}` as keyof NotificationSettings;
        
        if (shouldNotify(pushType)) {
          toast(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, notificationSettings]);

  const value = {
    notificationSettings,
    notifications,
    unreadCount,
    loading,
    fetchNotificationSettings,
    saveNotificationSettings,
    markAsRead,
    markAllAsRead,
    shouldNotify,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 