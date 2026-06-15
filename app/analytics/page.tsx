"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { CONTRACTS, readContract, requireAddress } from "@/lib/genlayer";
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
        const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
        const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
        const grantCount = (await readContract(gmAddr, "get_grant_count", [])) as bigint;
        const grantIds = Array.from({ length: Number(grantCount) }, (_, i) => `grant_${i}`);
        const grantData = (await Promise.all(
          grantIds.map(async (id) => {
            const json = await readContract(gmAddr, "get_grant", [id]);
            if (!json || json === "") return null;
            return JSON.parse(json as string) as Grant;
          })
        )).filter(Boolean) as Grant[];
        setGrants(grantData);

        const count = (await readContract(pmAddr, "get_proposal_count", [])) as bigint;
        const propIds = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);
        const propData = await Promise.all(
          propIds.map(async (id) => {
            const json = await readContract(pmAddr, "get_proposal", [id]);
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
    APPROVED: "bg-emerald-500",
    PENDING: "bg-amber-400",
    REJECTED: "bg-red-500",
    REVISION_REQUESTED: "bg-violet-500",
    APPEALED: "bg-blue-500",
    FUNDED: "bg-cyan-500",
    COMPLETED: "bg-teal-500",
  };

  const statusTextColors: Record<string, string> = {
    APPROVED: "text-emerald-600",
    PENDING: "text-amber-600",
    REJECTED: "text-red-600",
    REVISION_REQUESTED: "text-violet-600",
    APPEALED: "text-blue-600",
    FUNDED: "text-cyan-600",
    COMPLETED: "text-teal-600",
  };

  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics & Transparency</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live data from GenLayer StudioNet · All decisions are on-chain and auditable</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading on-chain analytics...
          </div>
        )}

        {!loading && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Grant Budget", value: `${(totalBudget / 1e18).toLocaleString()} GEN`, icon: Coins, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
                { label: "Total Proposals", value: proposals.length, icon: FileText, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
                { label: "Approval Rate", value: `${proposals.length > 0 ? Math.round(((statusCounts.APPROVED || 0) / proposals.length) * 100) : 0}%`, icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { label: "Avg AI Score", value: `${avgScore}/100`, icon: TrendingUp, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
              ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                <div key={label} className="card p-5">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Budget allocation */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> Budget Allocation
                </h2>
                <div className="space-y-4">
                  {grants.map((g) => {
                    const total = parseInt(g.total_budget);
                    const remaining = parseInt(g.remaining_budget);
                    const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                          <span className="truncate flex-1 mr-2 font-medium">{g.name}</span>
                          <span className="flex-shrink-0 text-gray-400">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>{((total - remaining) / 1e18).toLocaleString()} GEN allocated</span>
                          <span>{(remaining / 1e18).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    );
                  })}
                  {grants.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-6">No grant data</div>
                  )}
                </div>
              </div>

              {/* Proposal status breakdown */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Proposal Status Breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs font-medium w-36 ${statusTextColors[status] || "text-gray-500"}`}>{status}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusColors[status] || "bg-gray-400"} transition-all`}
                          style={{ width: `${proposals.length > 0 ? (count / proposals.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-400 w-6 text-right">{count}</span>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-6">No proposal data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Grant programs table */}
            {grants.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Grant Programs</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-3 text-left font-medium">Name</th>
                      <th className="pb-3 text-left font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Budget</th>
                      <th className="pb-3 text-right font-medium">Remaining</th>
                      <th className="pb-3 text-right font-medium">Proposals</th>
                      <th className="pb-3 text-right font-medium">Funded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grants.map((g) => (
                      <tr key={g.id} className="text-gray-600">
                        <td className="py-3 text-gray-900 font-medium">{g.name}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${g.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>
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
            <div className="card p-5 bg-blue-50 border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900 text-sm mb-1">Full On-Chain Transparency</div>
                  <p className="text-xs text-blue-600">
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
