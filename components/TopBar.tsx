"use client";
import { useState, useRef, useEffect } from "react";
import {
  Wallet, Bell, ChevronDown, Loader2, AlertCircle, LogOut,
  Coins, FileText, Brain, X, CheckCheck,
} from "lucide-react";
import { Button } from "./ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { useNotifications, Notification } from "@/lib/NotificationContext";

const TYPE_CONFIG = {
  grant_created:       { icon: Coins,    bg: "bg-blue-50",   color: "text-blue-600" },
  proposal_submitted:  { icon: FileText, bg: "bg-violet-50", color: "text-violet-600" },
  evaluation_done:     { icon: Brain,    bg: "bg-emerald-50",color: "text-emerald-600" },
};

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifItem({ n, onDismiss }: { n: Notification; onDismiss: (id: string) => void }) {
  const { icon: Icon, bg, color } = TYPE_CONFIG[n.type];
  return (
    <div className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-gray-900 leading-snug">{n.title}</span>
          <button
            onClick={() => onDismiss(n.id)}
            className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{n.message}</p>
        <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.timestamp)}</span>
      </div>
    </div>
  );
}

export function TopBar({ title }: { title?: string }) {
  const { address, connected, connecting, error, connect, disconnect, balance } = useWallet();
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications();
  const [walletOpen, setWalletOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}···${addr.slice(-4)}`;
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) setWalletOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleBell() {
    setBellOpen((v) => {
      if (!v) markAllRead();
      return !v;
    });
  }

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <h1 className="text-[13px] font-semibold text-gray-400 tracking-[-0.01em]">{title}</h1>

      <div className="flex items-center gap-2.5">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 max-w-[200px] truncate">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={toggleBell}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-xl border border-gray-100 bg-white shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
                  >
                    <CheckCheck className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotifItem key={n.id} n={n} onDismiss={dismiss} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wallet */}
        {connected && address ? (
          <div className="relative" ref={walletRef}>
            <button
              onClick={() => setWalletOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] font-semibold hover:bg-gray-100 transition-colors tracking-[-0.01em]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-gray-800">{shortAddr(address)}</span>
              {balance && (
                <span className="text-gray-400 text-xs border-l border-gray-200 pl-2 font-medium">
                  {balance} GEN
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {walletOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50">
                <button
                  onClick={() => { disconnect(); setWalletOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect wallet
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={connect} disabled={connecting}>
            {connecting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="w-3.5 h-3.5" /> Connect Wallet</>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
