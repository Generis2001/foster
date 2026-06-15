"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { useCreateGrant } from "@/lib/hooks";
import { STUDIONET_CHAIN } from "@/lib/genlayer";
import {
  CheckCircle,
  Loader2,
  Wallet,
  Coins,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CreateGrantPage() {
  const { connected, connect, connecting } = useWallet();
  const { createGrant, loading, error, txHash } = useCreateGrant();
  const [done, setDone] = useState(false);
  const [finalTxHash, setFinalTxHash] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    totalBudget: "",
    depositGEN: "",
    focusAreas: "",
    maxGrantSize: "",
    deadline: "",
    eligibility: "",
  });

  function u(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) {
      await connect();
      return;
    }
    try {
      const deadlineTs = BigInt(Math.floor(new Date(form.deadline).getTime() / 1000));
      const depositWei = BigInt(Math.round(parseFloat(form.depositGEN) * 1e18));
      const hash = await createGrant({
        name: form.name,
        description: form.description,
        totalBudget: BigInt(Math.round(parseFloat(form.totalBudget) * 1e18)),
        focusAreas: form.focusAreas,
        maxGrantSize: BigInt(Math.round(parseFloat(form.maxGrantSize) * 1e18)),
        deadline: deadlineTs,
        eligibility: form.eligibility,
        depositGEN: depositWei,
      });
      setFinalTxHash(hash || "");
      setDone(true);
    } catch {
      // error shown via hook
    }
  }

  if (done) {
    return (
      <AppLayout title="Create Grant Program">
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Grant Program Created!</h2>
          <p className="text-white/50 mb-6">
            Your grant program is now live on GenLayer StudioNet. Teams can submit proposals immediately.
          </p>
          {finalTxHash && (
            <div className="glass rounded-xl p-4 text-left mb-6">
              <div className="text-xs text-white/40 mb-1">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-blue-400 break-all flex-1">{finalTxHash}</div>
                <a
                  href={`${STUDIONET_CHAIN.explorer}/tx/${finalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60 flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/grants">
              <Button variant="secondary">View All Grants</Button>
            </Link>
            <Button onClick={() => { setDone(false); setForm({ name: "", description: "", totalBudget: "", depositGEN: "", focusAreas: "", maxGrantSize: "", deadline: "", eligibility: "" }); }}>
              Create Another
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Create Grant Program">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create Grant Program</h1>
          <p className="text-sm text-white/40">
            Deploy a grant program on GenLayer StudioNet. GEN tokens are deposited into an on-chain escrow
            contract and released to approved projects via AI validator consensus.
          </p>
        </div>

        {!connected && (
          <div className="mb-6 p-4 glass rounded-xl border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-medium text-white">Connect Wallet Required</div>
                <div className="text-xs text-white/40">You need a wallet with GEN to create a grant</div>
              </div>
            </div>
            <Button size="sm" onClick={connect} disabled={connecting}>
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              Connect
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
          <Input
            label="Grant Program Name"
            placeholder="GenLayer Ecosystem Fund 2026"
            value={form.name}
            onChange={(e) => u("name", e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="What is this grant for? What types of projects will you fund?"
            value={form.description}
            onChange={(e) => u("description", e.target.value)}
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Budget (GEN)"
              type="number"
              placeholder="50000"
              value={form.totalBudget}
              onChange={(e) => u("totalBudget", e.target.value)}
              hint="Total GEN to be awarded"
              required
            />
            <Input
              label="Initial Deposit (GEN)"
              type="number"
              placeholder="50000"
              value={form.depositGEN}
              onChange={(e) => u("depositGEN", e.target.value)}
              hint="GEN sent with this transaction"
              required
            />
          </div>

          <Input
            label="Max Grant Size (GEN)"
            type="number"
            placeholder="10000"
            value={form.maxGrantSize}
            onChange={(e) => u("maxGrantSize", e.target.value)}
            hint="Maximum GEN per approved proposal"
            required
          />

          <Input
            label="Focus Areas"
            placeholder="AI, Infrastructure, Open Source, DeFi"
            value={form.focusAreas}
            onChange={(e) => u("focusAreas", e.target.value)}
            hint="Comma-separated list of categories"
            required
          />

          <Input
            label="Application Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => u("deadline", e.target.value)}
            required
          />

          <Textarea
            label="Eligibility Criteria"
            placeholder="Who can apply? Requirements for teams and projects..."
            value={form.eligibility}
            onChange={(e) => u("eligibility", e.target.value)}
            rows={3}
            required
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="glass rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium mb-2">
              <Coins className="w-3.5 h-3.5" />
              On-Chain Transaction
            </div>
            <p className="text-xs text-white/50">
              This will send a transaction to GenLayer StudioNet (Chain ID: 61999) depositing
              {form.depositGEN ? ` ${form.depositGEN} GEN` : " your specified GEN"} into an escrow contract.
              Funds are released only when proposals are approved and milestones verified.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !form.name}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating Grant On-Chain...</>
            ) : !connected ? (
              <><Wallet className="w-4 h-4" /> Connect Wallet to Continue</>
            ) : (
              <><Coins className="w-4 h-4" /> Deploy Grant Program</>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
