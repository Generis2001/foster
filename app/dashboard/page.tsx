"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { CONTRACTS, readContract } from "@/lib/genlayer";
import { Grant, Proposal } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import Link from "next/link";
import {
  TrendingUp, FileText, Coins, CheckCircle, ArrowRight,
  Brain, Loader2, AlertTriangle, Plus, Wallet,
} from "lucide-react";

export default function DashboardPage() {
  const { connected, connect, connecting, address } = useWallet();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractsReady, setContractsReady] = useState(false);

  useEffect(() => {
    setContractsReady(!!(CONTRACTS.grantManager && CONTRACTS.proposalManager));
  }, []);

  useEffect(() => {
    async function load() {
      if (!CONTRACTS.grantManager || !CONTRACTS.proposalManager) {
        setLoading(false);
        return;
      }
      try {
        // Load grants
        const grantIds = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
        const grantData = await Promise.all(
          grantIds.map(async (id) => {
            const json = await readContract(CONTRACTS.grantManager, "get_grant", [id]);
            return JSON.parse(json as string) as Grant;
          })
        );
        setGrants(grantData);

        // Load recent proposals (for current user if connected, else all)
        const count = (await readContract(CONTRACTS.proposalManager, "get_proposal_count", [])) as bigint;
        const propIds = Array.from({ length: Math.min(Number(count), 20) }, (_, i) => `prop_${i}`);
        const propData = await Promise.all(
          propIds.map(async (id) => {
            const json = await readContract(CONTRACTS.proposalManager, "get_proposal", [id]);
            if (!json || json === "") return null;
            return JSON.parse(json as string) as Proposal;
          })
        );
        setProposals(propData.filter(Boolean) as Proposal[]);
      } catch {
        // Contract read failed
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBudget = grants.reduce((s, g) => s + parseInt(g.remaining_budget), 0);
  const pendingProposals = proposals.filter((p) => p.status === "PENDING").length;
  const approvedProposals = proposals.filter((p) => p.status === "APPROVED").length;

  const myProposals = address
    ? proposals.filter((p) => p.proposer.toLowerCase() === address.toLowerCase())
    : [];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Wallet CTA if not connected */}
        {!connected && (
          <div className="p-5 glass rounded-xl border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-white mb-0.5">Connect your wallet</div>
                <div className="text-sm text-white/40">Connect to GenLayer StudioNet to submit proposals or create grants</div>
              </div>
            </div>
            <Button onClick={connect} disabled={connecting} size="sm">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Contract not deployed warning */}
        {!contractsReady && (
          <div className="flex items-start gap-3 p-4 glass rounded-xl border border-amber-500/20 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-300 mb-1">Contracts Not Configured</div>
              <div className="text-white/50 text-xs">
                Deploy the Intelligent Contracts via GenLayer Studio, then set contract addresses
                in <code className="text-blue-400">.env.local</code>:
              </div>
              <pre className="mt-2 text-xs text-white/40 bg-white/5 rounded p-2 font-mono">
{`NEXT_PUBLIC_GRANT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS=0x...`}
              </pre>
            </div>
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-3 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading on-chain data...
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Active Grants", value: grants.filter(g => g.status === "ACTIVE").length, sub: `${totalBudget.toLocaleString()} GEN available`, icon: Coins, color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Total Proposals", value: proposals.length, sub: `${pendingProposals} pending evaluation`, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: "Approved", value: approvedProposals, sub: "proposals funded", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Grants Funded", value: grants.reduce((s, g) => s + g.funded_count, 0), sub: "milestone payouts made", icon: Brain, color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} size={18} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-white/20" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
                <div className="text-xs text-white/40">{label}</div>
                <div className="text-xs text-white/30 mt-1">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && contractsReady && (
          <div className="grid grid-cols-3 gap-4">
            {/* Recent Proposals */}
            <div className="col-span-2 glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">
                  {myProposals.length > 0 ? "My Proposals" : "Recent Proposals"}
                </h2>
                <Link href="/grants">
                  <Button variant="ghost" size="sm">View all <ArrowRight className="w-3.5 h-3.5" /></Button>
                </Link>
              </div>
              {(myProposals.length > 0 ? myProposals : proposals).slice(0, 8).map((p) => (
                <Link href={`/proposals/${p.id}`} key={p.id}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{p.title}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {parseInt(p.requested_amount).toLocaleString()} GEN · {p.grant_id}
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                    {p.evaluation_score != null && (
                      <div className="text-xs font-mono text-white/50 w-14 text-right">
                        {p.evaluation_score}/100
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {proposals.length === 0 && (
                <div className="text-center py-10 text-white/30 text-sm">
                  No proposals yet. <Link href="/proposals/submit" className="text-blue-400 hover:underline">Submit the first one.</Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Link href="/grants">
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer border border-blue-500/10 hover:border-blue-500/20 transition-all">
                  <Coins className="w-6 h-6 text-blue-400 mb-3" />
                  <div className="font-medium text-white mb-1">Browse Grants</div>
                  <div className="text-xs text-white/40">Discover funding for your project</div>
                </div>
              </Link>
              <Link href="/proposals/submit">
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer border border-purple-500/10 hover:border-purple-500/20 transition-all">
                  <FileText className="w-6 h-6 text-purple-400 mb-3" />
                  <div className="font-medium text-white mb-1">Submit Proposal</div>
                  <div className="text-xs text-white/40">Apply for grant funding</div>
                </div>
              </Link>
              <Link href="/grants/create">
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                  <Plus className="w-6 h-6 text-emerald-400 mb-3" />
                  <div className="font-medium text-white mb-1">Create Grant</div>
                  <div className="text-xs text-white/40">Fund the next wave of builders</div>
                </div>
              </Link>
              <Link href="/validator">
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer border border-amber-500/10 hover:border-amber-500/20 transition-all">
                  <Brain className="w-6 h-6 text-amber-400 mb-3" />
                  <div className="font-medium text-white mb-1">Validator Hub</div>
                  <div className="text-xs text-white/40">Trigger AI evaluation rounds</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
