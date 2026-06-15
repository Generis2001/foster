"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { ensureStudioNet } from "@/lib/genlayer";

interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  balance: string | null;
}

const WalletContext = createContext<WalletState>({
  address: null,
  connected: false,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  balance: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const bal = await window.ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      }) as string;
      const ether = (parseInt(bal, 16) / 1e18).toFixed(4);
      setBalance(ether);
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use Foster.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await ensureStudioNet();
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];
      if (accounts[0]) {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  useEffect(() => {
    // Auto-reconnect if already connected
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        const accs = accounts as string[];
        if (accs[0]) {
          setAddress(accs[0]);
          fetchBalance(accs[0]);
        }
      }).catch(() => {});

      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs[0]) {
          setAddress(accs[0]);
          fetchBalance(accs[0]);
        } else {
          setAddress(null);
          setBalance(null);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    }
  }, [fetchBalance]);

  return (
    <WalletContext.Provider
      value={{ address, connected: !!address, connecting, error, connect, disconnect, balance }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
