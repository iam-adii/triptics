# Notification System Documentation

The notification system in Triptics allows users to receive and manage notifications for various events within the application. This document explains how to use and extend the notification functionality.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Usage](#usage)
4. [Sending Notifications](#sending-notifications)
5. [Notification Settings](#notification-settings)
6. [Database Schema](#database-schema)
7. [Extending the System](#extending-the-system)

## Overview

The notification system consists of several components:

- **NotificationContext**: Manages notification state and provides methods for interacting with notifications
- **NotificationBell**: UI component for displaying notifications and unread count
- **NotificationService**: Service for sending different types of notifications
- **Settings Page**: Interface for users to configure their notification preferences

## Components

### NotificationContext

The `NotificationContext` provides the following functionality:

- Fetch and store user's notification settings
- Fetch and store user's notifications
- Mark notifications as read
- Check if a user should be notified for a specific type
- Send new notifications

### NotificationBell

The `NotificationBell` component displays:

- A bell icon in the header
- A badge showing the number of unread notifications
- A dropdown menu showing recent notifications
- Options to mark notifications as read

### NotificationService

The `notificationService` provides helper functions for sending different types of notifications:

- `sendNotification`: Send a notification to a specific user
- `sendNotificationToUsers`: Send a notification to multiple users
- `sendNotificationToRole`: Send a notification to all users with a specific role
- Helper functions for specific notification types (leads, bookings, payments, etc.)

## Usage

### Setting Up

The notification system is already set up in the application. The `NotificationProvider` is included in the main `App` component, and the `NotificationBell` is included in the `Header` component.

### Using the Hook

To use notifications in your components, import and use the `useNotifications` hook:

```tsx
import { useNotifications } from '@/contexts/NotificationContext';

function MyComponent() {
  const { 
    notifications,
    notificationSettings,
    unreadCount,
    markAsRead,
    markAllAsRead,
    shouldNotify,
    sendNotification
  } = useNotifications();

  // Your component code...
}
```

## Sending Notifications

### Using the Context

You can send notifications directly using the context:

```tsx
const { sendNotification } = useNotifications();

sendNotification({
  title: 'New Booking',
  message: 'A new booking has been created',
  type: 'booking'
});
```

### Using the Service

For more complex scenarios, use the notification service:

```tsx
import { 
  sendNewLeadNotification, 
  sendNewBookingNotification 
} from '@/services/notificationService';

// Send a lead notification
await sendNewLeadNotification(userId, 'John Doe');

// Send a booking notification
await sendNewBookingNotification(userId, 'John Doe', 'Goa Beach Tour');
```

## Notification Settings

Users can manage their notification preferences in the Settings page under the "Notifications" tab. The following settings are available:

### Email Notifications
- New Leads
- New Bookings
- Payment Receipts
- Tour Reminders
- Marketing Emails

### Push Notifications
- New Leads
- New Bookings
- Payment Received

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead', 'booking', 'payment', 'reminder', 'marketing', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notification Settings Table

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_leads BOOLEAN NOT NULL DEFAULT true,
  new_bookings BOOLEAN NOT NULL DEFAULT true,
  payment_receipts BOOLEAN NOT NULL DEFAULT true,
  tour_reminders BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  push_leads BOOLEAN NOT NULL DEFAULT true,
  push_bookings BOOLEAN NOT NULL DEFAULT true,
  push_payments BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_notification_settings UNIQUE (user_id)
);
```

## Extending the System

### Adding New Notification Types

1. Update the `NotificationType` type in `NotificationContext.tsx`
2. Add the new type to the database CHECK constraint
3. Add a new field to the `NotificationSettings` interface and table
4. Create helper functions in `notificationService.ts`
5. Update the settings UI in `Settings.tsx`

### Customizing Notification Display

To customize how notifications are displayed, modify the `NotificationBell` component in `src/components/NotificationBell.tsx`.

### Adding Real-time Notifications

The system already supports real-time notifications using Supabase's real-time functionality. When a new notification is inserted into the database, it will automatically appear in the UI without requiring a page refresh. 