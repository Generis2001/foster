"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { CONTRACTS, readContract } from "@/lib/genlayer";
import { Grant, Proposal } from "@/lib/types";
import { Loader2, BarChart3, Coins, FileText, CheckCircle, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!CONTRACTS.grantManager || !CONTRACTS.proposalManager) {
        setLoading(false);
        return;
      }
      try {
        const grantIds = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
        const grantData = await Promise.all(
          grantIds.map(async (id) => {
            const json = await readContract(CONTRACTS.grantManager, "get_grant", [id]);
            return JSON.parse(json as string) as Grant;
          })
        );
        setGrants(grantData);

        const count = (await readContract(CONTRACTS.proposalManager, "get_proposal_count", [])) as bigint;
        const propIds = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);
        const propData = await Promise.all(
          propIds.map(async (id) => {
            const json = await readContract(CONTRACTS.proposalManager, "get_proposal", [id]);
            if (!json || json === "") return null;
            return JSON.parse(json as string) as Proposal;
          })
        );
        setProposals(propData.filter(Boolean) as Proposal[]);
      } catch { /**/ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const totalBudget = grants.reduce((s, g) => s + parseInt(g.total_budget), 0);
  const totalRemaining = grants.reduce((s, g) => s + parseInt(g.remaining_budget), 0);
  const totalAllocated = totalBudget - totalRemaining;
  const allocationPct = totalBudget > 0 ? Math.round((totalAllocated / totalBudget) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  proposals.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

  const evaluatedCount = proposals.filter((p) => p.evaluation_score !== null).length;
  const avgScore = evaluatedCount > 0
    ? Math.round(proposals.reduce((s, p) => s + (p.evaluation_score || 0), 0) / evaluatedCount)
    : 0;

  const statusColors: Record<string, string> = {
    APPROVED: "text-green-400",
    PENDING: "text-amber-400",
    REJECTED: "text-red-400",
    REVISION_REQUESTED: "text-purple-400",
    APPEALED: "text-blue-400",
    FUNDED: "text-cyan-400",
    COMPLETED: "text-emerald-400",
  };

  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Transparency</h1>
          <p className="text-sm text-white/40 mt-1">Live data from GenLayer StudioNet · All decisions are on-chain and auditable</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading on-chain analytics...
          </div>
        )}

        {!loading && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Grant Budget", value: `${(totalBudget / 1e18).toLocaleString()} GEN`, icon: Coins, color: "text-blue-400" },
                { label: "Total Proposals", value: proposals.length, icon: FileText, color: "text-purple-400" },
                { label: "Approval Rate", value: `${proposals.length > 0 ? Math.round(((statusCounts.APPROVED || 0) / proposals.length) * 100) : 0}%`, icon: CheckCircle, color: "text-green-400" },
                { label: "Avg AI Score", value: `${avgScore}/100`, icon: TrendingUp, color: "text-amber-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-5">
                  <Icon className={`w-5 h-5 ${color} mb-3`} />
                  <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Budget allocation */}
              <div className="glass rounded-xl p-6">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Budget Allocation
                </h2>
                <div className="space-y-4">
                  {grants.map((g) => {
                    const total = parseInt(g.total_budget);
                    const remaining = parseInt(g.remaining_budget);
                    const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs text-white/60 mb-1.5">
                          <span className="truncate flex-1 mr-2">{g.name}</span>
                          <span className="flex-shrink-0">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/30 mt-1">
                          <span>{((total - remaining) / 1e18).toLocaleString()} GEN allocated</span>
                          <span>{(remaining / 1e18).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    );
                  })}
                  {grants.length === 0 && (
                    <div className="text-white/30 text-sm text-center py-6">No grant data</div>
                  )}
                </div>
              </div>

              {/* Proposal status breakdown */}
              <div className="glass rounded-xl p-6">
                <h2 className="font-semibold text-white mb-5">Proposal Status Breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs font-medium w-32 ${statusColors[status] || "text-white/50"}`}>{status}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-current opacity-60 transition-all"
                          style={{ width: `${proposals.length > 0 ? (count / proposals.length) * 100 : 0}%`, color: statusColors[status]?.replace("text-", "") || "white" }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/50 w-6 text-right">{count}</span>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <div className="text-white/30 text-sm text-center py-6">No proposal data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Grant programs table */}
            {grants.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="font-semibold text-white mb-5">Grant Programs</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-white/40 border-b border-white/10">
                      <th className="pb-3 text-left font-medium">Name</th>
                      <th className="pb-3 text-left font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Budget</th>
                      <th className="pb-3 text-right font-medium">Remaining</th>
                      <th className="pb-3 text-right font-medium">Proposals</th>
                      <th className="pb-3 text-right font-medium">Funded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {grants.map((g) => (
                      <tr key={g.id} className="text-white/70">
                        <td className="py-3 text-white font-medium">{g.name}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${g.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/40"}`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-xs">{(parseInt(g.total_budget) / 1e18).toLocaleString()} GEN</td>
                        <td className="py-3 text-right font-mono text-xs">{(parseInt(g.remaining_budget) / 1e18).toLocaleString()} GEN</td>
                        <td className="py-3 text-right">{g.proposal_count}</td>
                        <td className="py-3 text-right">{g.funded_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* On-chain transparency note */}
            <div className="glass rounded-xl p-5 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm mb-1">Full On-Chain Transparency</div>
                  <p className="text-xs text-white/50">
                    Every grant, proposal, evaluation, and milestone payout is recorded on GenLayer StudioNet (Chain ID: 61999).
                    All AI validator decisions are stored with full reasoning and consensus vote breakdowns.
                    No data is off-chain or behind closed doors.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
