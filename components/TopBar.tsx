"use client";
import { Wallet, Bell, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { useWallet } from "@/lib/WalletContext";

export function TopBar({ title }: { title?: string }) {
  const { address, connected, connecting, error, connect, balance } = useWallet();

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}···${addr.slice(-4)}`;
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

        <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
          <Bell className="w-4 h-4" />
        </button>

        {connected && address ? (
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] font-semibold hover:bg-gray-100 transition-colors tracking-[-0.01em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-gray-800">{shortAddr(address)}</span>
            {balance && (
              <span className="text-gray-400 text-xs border-l border-gray-200 pl-2 font-medium">
                {balance} GEN
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
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
