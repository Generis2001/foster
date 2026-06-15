"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { CONTRACTS, readContract } from "@/lib/genlayer";
import { Grant, Proposal } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import Link from "next/link";
import { TrendingUp, FileText, Coins, CheckCircle, ArrowRight, Brain, Loader2, AlertTriangle, Plus, Wallet } from "lucide-react";

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
      if (!CONTRACTS.grantManager || !CONTRACTS.proposalManager) { setLoading(false); return; }
      try {
        const grantIds = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
        const grantData = await Promise.all(grantIds.map(async (id) => JSON.parse((await readContract(CONTRACTS.grantManager, "get_grant", [id])) as string) as Grant));
        setGrants(grantData);

        const count = (await readContract(CONTRACTS.proposalManager, "get_proposal_count", [])) as bigint;
        const propIds = Array.from({ length: Math.min(Number(count), 20) }, (_, i) => `prop_${i}`);
        const propData = await Promise.all(propIds.map(async (id) => {
          const json = await readContract(CONTRACTS.proposalManager, "get_proposal", [id]);
          if (!json || json === "") return null;
          return JSON.parse(json as string) as Proposal;
        }));
        setProposals(propData.filter(Boolean) as Proposal[]);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const totalBudget = grants.reduce((s, g) => s + parseInt(g.remaining_budget), 0);
  const pendingProposals = proposals.filter((p) => p.status === "PENDING").length;
  const approvedProposals = proposals.filter((p) => p.status === "APPROVED").length;
  const myProposals = address ? proposals.filter((p) => p.proposer.toLowerCase() === address.toLowerCase()) : [];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-5">
        {/* Wallet connect */}
        {!connected && (
          <div className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-0.5">Connect your wallet</div>
                <div className="text-sm text-gray-500">Connect to GenLayer StudioNet to interact with grant contracts</div>
              </div>
            </div>
            <Button onClick={connect} disabled={connecting} size="sm">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Contracts not configured */}
        {!contractsReady && (
          <div className="card p-5 border-l-4 border-l-amber-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-900 mb-1">Contracts Not Configured</div>
                <p className="text-sm text-gray-500 mb-2">Deploy contracts via GenLayer Studio, then add addresses to <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code>.</p>
                <pre className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-3 font-mono">{`NEXT_PUBLIC_GRANT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS=0x...`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading on-chain data...
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Active Grants", value: grants.filter(g => g.status === "ACTIVE").length, sub: `${(totalBudget / 1e18).toLocaleString()} GEN available`, icon: Coins, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
              { label: "Total Proposals", value: proposals.length, sub: `${pendingProposals} awaiting evaluation`, icon: FileText, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
              { label: "Approved", value: approvedProposals, sub: "proposals funded", icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
              { label: "Grants Funded", value: grants.reduce((s, g) => s + g.funded_count, 0), sub: "milestone payouts made", icon: Brain, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
            ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
              <div key={label} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
                <div className="text-sm font-medium text-gray-600">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && contractsReady && (
          <div className="grid grid-cols-3 gap-4">
            {/* Proposals */}
            <div className="col-span-2 card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  {myProposals.length > 0 ? "My Proposals" : "Recent Proposals"}
                </h2>
                <Link href="/grants">
                  <Button variant="ghost" size="sm">View all <ArrowRight className="w-3.5 h-3.5" /></Button>
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {(myProposals.length > 0 ? myProposals : proposals).slice(0, 8).map((p) => (
                  <Link href={`/proposals/${p.id}`} key={p.id}>
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{p.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {(parseInt(p.requested_amount) / 1e18).toLocaleString()} GEN · {p.grant_id}
                        </div>
                      </div>
                      <StatusBadge status={p.status} size="sm" />
                      {p.evaluation_score != null && (
                        <div className="text-xs font-mono text-gray-400 w-14 text-right">{p.evaluation_score}/100</div>
                      )}
                    </div>
                  </Link>
                ))}
                {proposals.length === 0 && (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">
                    No proposals yet.{" "}
                    <Link href="/proposals/submit" className="text-blue-600 hover:underline font-medium">Submit the first one.</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              {[
                { href: "/grants", icon: Coins, label: "Browse Grants", sub: "Discover open funding", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
                { href: "/proposals/submit", icon: FileText, label: "Submit Proposal", sub: "Apply for funding", iconBg: "bg-violet-50", iconColor: "text-violet-600" },
                { href: "/grants/create", icon: Plus, label: "Create Grant", sub: "Fund the next builders", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { href: "/validator", icon: Brain, label: "Validator Hub", sub: "Trigger AI evaluations", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
              ].map(({ href, icon: Icon, label, sub, iconBg, iconColor }) => (
                <Link href={href} key={href}>
                  <div className="card card-hover p-4 flex items-center gap-3 cursor-pointer">
                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${iconColor}`} size={18} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-400">{sub}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
