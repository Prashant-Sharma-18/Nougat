"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "./UserContext";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/actions/notifications";
import { 
  Bell, 
  CheckCheck, 
  Gift, 
  Coins, 
  Flame, 
  Crown, 
  AlertTriangle, 
  Info,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function NotificationCenter() {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await getUserNotifications(currentUser.id);
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleItemClick = async (item: any) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <Gift className="h-4 w-4 text-zinc-800" />;
      case "STREAK":
        return <Flame className="h-4 w-4 text-zinc-800" />;
      case "TIER":
        return <Crown className="h-4 w-4 text-zinc-800" />;
      case "EARN":
        return <Coins className="h-4 w-4 text-zinc-800" />;
      case "REFUND":
        return <AlertTriangle className="h-4 w-4 text-zinc-800" />;
      default:
        return <Info className="h-4 w-4 text-zinc-800" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative shrink-0" ref={popoverRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors shrink-0"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-zinc-950 text-[9px] font-mono font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-950">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-800 text-[10px] font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors font-mono"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="h-7 w-7 text-zinc-300 mx-auto" />
                <p className="text-xs font-medium text-zinc-700">No notifications yet</p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Earn points or redeem gift cards to receive updates.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    item.isRead ? "bg-white hover:bg-zinc-50" : "bg-zinc-50 hover:bg-zinc-100"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-zinc-200 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-zinc-950 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-950 hover:underline mt-1 font-mono"
                      >
                        <span>View details</span>
                        <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
                      </Link>
                    )}
                  </div>
                  {!item.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 text-center">
            <span className="text-[10px] text-zinc-400 font-mono">
              Real-time activity and balance updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
