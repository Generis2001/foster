"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type NotifType = "grant_created" | "proposal_submitted" | "evaluation_done";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  add: (type: NotifType, title: string, message: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotifContext = createContext<NotifState>({
  notifications: [],
  unreadCount: 0,
  add: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((type: NotifType, title: string, message: string) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotifContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        add,
        markAllRead,
        dismiss,
        clearAll,
      }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
