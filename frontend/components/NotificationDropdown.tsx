'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Bell, AlertCircle, CheckCircle2, Truck, 
  Loader2, ShoppingBag, Info, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count (Called on Mount)
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Initial fetch for badge
  useEffect(() => {
    fetchUnreadCount();
    // Optional: Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications list
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${API_BASE}/api/notifications/me?page=1&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Toggle Dropdown
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get visually pleasing icons and colors based on notification type
  const getIconConfig = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_confirmed':
        return { Icon: ShoppingBag, bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'payment_success':
        return { Icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600' };
      case 'payment_failed':
        return { Icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-600' };
      case 'delivery_assigned':
      case 'delivery_picked_up':
      case 'delivery_completed':
        return { Icon: Truck, bg: 'bg-purple-50', text: 'text-purple-600' };
      default:
        return { Icon: Info, bg: 'bg-slate-100', text: 'text-slate-600' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button (Matches Navbar style) */}
      <button
        onClick={handleToggle}
        className="relative p-2.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm px-1 animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell size={18} className="text-orange-600" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500 font-medium">Checking updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-bold text-slate-900 mb-1">You're all caught up!</p>
                <p className="text-sm text-slate-500">No new notifications at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => {
                  const { Icon, bg, text } = getIconConfig(notification.type);
                  
                  return (
                    <div
                      key={notification._id}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                      className={`group flex gap-4 px-5 py-4 cursor-pointer transition-colors ${
                        notification.isRead
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-orange-50/30 hover:bg-orange-50/60'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg} ${text}`}>
                        <Icon size={18} />
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 line-clamp-1 ${notification.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs line-clamp-2 leading-relaxed ${notification.isRead ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                          {notification.message}
                        </p>
                        <time className="text-[10px] text-slate-400 mt-2 block font-medium uppercase tracking-wider">
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' • '}
                          {new Date(notification.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric'
                          })}
                        </time>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="shrink-0 flex items-center justify-center pt-1.5">
                          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm shadow-orange-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 w-full py-2.5 text-xs font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            >
              View all notifications <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}