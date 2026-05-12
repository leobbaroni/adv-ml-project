'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const severityDot: Record<string, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();
  const { data: notifications } = trpc.notification.list.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-btn hover:bg-bg-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-fg" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 surface shadow-lg z-50">
          <div className="px-4 py-3 border-b border-bg-border flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {!!unreadCount && unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-accent hover:text-amber-400 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications?.length && (
              <div className="px-4 py-6 text-center text-sm text-fg-muted">
                No notifications
              </div>
            )}
            {notifications?.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.readAt) markRead.mutate({ id: n.id });
                }}
                className={`w-full text-left px-4 py-3 border-b border-bg-border last:border-b-0 hover:bg-bg-surface transition-colors ${
                  n.readAt ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      severityDot[n.severity] ?? 'bg-fg-muted'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">
                      {n.kind.replace(/_/g, ' ')}
                    </p>
                    {n.property?.name && (
                      <p className="text-xs text-fg-muted truncate">
                        {n.property.name}
                      </p>
                    )}
                    <p className="text-xs text-fg-muted mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
