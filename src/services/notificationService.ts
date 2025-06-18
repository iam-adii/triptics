import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/contexts/NotificationContext';

type NotificationType = 'lead' | 'booking' | 'payment' | 'reminder' | 'marketing' | 'system';

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  user_id: string;
}

// Send a notification to a specific user
export const sendNotification = async (
  data: NotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('notifications').insert({
      ...data,
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Send a notification to multiple users
export const sendNotificationToUsers = async (
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType
): Promise<{ success: boolean; error?: string }> => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending notifications to users:', error);
    return { success: false, error: error.message };
  }
};

// Send a notification to all users with a specific role
export const sendNotificationToRole = async (
  role: string,
  title: string,
  message: string,
  type: NotificationType
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First get all users with the specified role
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', role);

    if (userError) {
      throw userError;
    }

    if (!users || users.length === 0) {
      return { success: true }; // No users with this role
    }

    // Send notification to all users with this role
    const userIds = users.map(user => user.id);
    return await sendNotificationToUsers(userIds, title, message, type);
  } catch (error: any) {
    console.error('Error sending notifications to role:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions for specific notification types

// New lead notification
export const sendNewLeadNotification = async (
  userId: string,
  leadName: string
): Promise<{ success: boolean; error?: string }> => {
  return await sendNotification({
    user_id: userId,
    title: 'New Lead Added',
    message: `A new lead "${leadName}" has been added to your pipeline.`,
    type: 'lead',
  });
};

// New booking notification
export const sendNewBookingNotification = async (
  userId: string,
  customerName: string,
  tourName: string
): Promise<{ success: boolean; error?: string }> => {
  return await sendNotification({
    user_id: userId,
    title: 'New Booking Confirmed',
    message: `${customerName} has confirmed booking for "${tourName}".`,
    type: 'booking',
  });
};

// Payment notification
export const sendPaymentNotification = async (
  userId: string,
  customerName: string,
  amount: number,
  tourName?: string
): Promise<{ success: boolean; error?: string }> => {
  const message = tourName
    ? `Payment of ₹${amount.toLocaleString()} received from ${customerName} for "${tourName}".`
    : `Payment of ₹${amount.toLocaleString()} received from ${customerName}.`;

  return await sendNotification({
    user_id: userId,
    title: 'Payment Received',
    message,
    type: 'payment',
  });
};

// Tour reminder notification
export const sendTourReminderNotification = async (
  userId: string,
  tourName: string,
  startDate: string
): Promise<{ success: boolean; error?: string }> => {
  const date = new Date(startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return await sendNotification({
    user_id: userId,
    title: 'Upcoming Tour Reminder',
    message: `Reminder: "${tourName}" is scheduled to start on ${date}.`,
    type: 'reminder',
  });
};

// Marketing notification
export const sendMarketingNotification = async (
  userId: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  return await sendNotification({
    user_id: userId,
    title,
    message,
    type: 'marketing',
  });
};

// Delete notifications older than a certain date
export const deleteOldNotifications = async (
  days: number = 30
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting old notifications:', error);
    return { success: false, error: error.message };
  }
}; 