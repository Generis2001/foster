"use client";
import { Wallet, Bell, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { useWallet } from "@/lib/WalletContext";

export function TopBar({ title }: { title?: string }) {
  const { address, connected, connecting, error, connect, balance } = useWallet();

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-xl">
      <h1 className="text-sm font-medium text-white/60">{title}</h1>

      <div className="flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 max-w-[200px] truncate">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
          <Bell className="w-4 h-4" />
        </button>

        {connected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white/80">{shortAddr(address)}</span>
            {balance && (
              <span className="text-white/40 text-xs border-l border-white/10 pl-2">
                {balance} GEN
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-white/40" />
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
