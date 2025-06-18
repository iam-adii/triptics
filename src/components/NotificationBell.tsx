import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Format the notification time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return '👤';
      case 'booking':
        return '✅';
      case 'payment':
        return '💰';
      case 'reminder':
        return '⏰';
      case 'marketing':
        return '📢';
      default:
        return '📌';
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-white"
              variant="secondary"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs text-emerald-500 hover:text-emerald-600"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-default ${
                  !notification.read ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <span>{getNotificationIcon(notification.type)}</span>
                    {notification.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-3 right-3" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 