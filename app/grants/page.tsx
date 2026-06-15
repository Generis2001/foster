"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Grant } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CONTRACTS, readContract } from "@/lib/genlayer";
import {
  Search,
  Filter,
  Coins,
  Clock,
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "AI",
  "Infrastructure",
  "Open Source",
  "Education",
  "DeFi",
  "Research",
  "Developer Tools",
];

function GrantCard({ grant }: { grant: Grant }) {
  const focusAreas = grant.focus_areas.split(",");
  const totalBudget = parseInt(grant.total_budget);
  const remaining = parseInt(grant.remaining_budget);
  const pct = totalBudget > 0 ? Math.round(((totalBudget - remaining) / totalBudget) * 100) : 0;

  return (
    <div className="glass glass-hover rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Coins className="w-5 h-5 text-blue-400" />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          grant.status === "ACTIVE"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-white/5 text-white/40 border-white/10"
        }`}>
          {grant.status}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-1.5">{grant.name}</h3>
        <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">{grant.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {focusAreas.slice(0, 3).map((area) => (
          <span key={area} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/[0.08]">
            {area.trim()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-sm font-semibold text-white">{parseInt(grant.max_grant_size).toLocaleString()}</div>
          <div className="text-[10px] text-white/30">Max GEN</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{grant.proposal_count}</div>
          <div className="text-[10px] text-white/30">Proposals</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{grant.funded_count}</div>
          <div className="text-[10px] text-white/30">Funded</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>{remaining.toLocaleString()} GEN remaining</span>
          <span>{pct}% allocated</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <Clock className="w-3 h-3" />
        Deadline: {new Date(parseInt(grant.deadline) * 1000).toLocaleDateString()}
      </div>

      <Link href={`/proposals/submit?grant=${grant.id}`}>
        <Button className="w-full" size="sm">
          Apply Now <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function load() {
      if (!CONTRACTS.grantManager) {
        setError("Contracts not deployed yet. Deploy GrantManager.py to GenLayer Studio first.");
        setLoading(false);
        return;
      }
      try {
        const ids = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
        const results = await Promise.all(
          ids.map(async (id) => {
            const json = await readContract(CONTRACTS.grantManager, "get_grant", [id]);
            return JSON.parse(json as string) as Grant;
          })
        );
        setGrants(results);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = grants.filter((g) => {
    const matchSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      category === "All" ||
      g.focus_areas.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <AppLayout title="Discover Grants">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Grant Programs</h1>
            <p className="text-sm text-white/40 mt-1">
              {loading ? "Loading..." : `${grants.length} active grants on GenLayer StudioNet`}
            </p>
          </div>
          <Link href="/grants/create">
            <Button size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create Grant Program
            </Button>
          </Link>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search grants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <Button variant="secondary" size="md">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:text-white/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading grants from GenLayer StudioNet...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm mb-1">Contract Not Connected</div>
              <div className="text-xs text-amber-300/70">{error}</div>
              <div className="text-xs text-amber-300/50 mt-2">
                Set NEXT_PUBLIC_GRANT_MANAGER_ADDRESS in .env.local after deploying via GenLayer Studio.
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <Coins className="w-8 h-8 mx-auto mb-3 text-white/20" />
            <div className="text-white/40 mb-2">No grants found</div>
            <div className="text-sm text-white/30">
              {grants.length === 0
                ? "Be the first to create a grant program on Foster."
                : "Try adjusting your search or category filter."}
            </div>
            {grants.length === 0 && (
              <Link href="/grants/create" className="mt-4 inline-block">
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5" /> Create First Grant
                </Button>
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
            ))}
          </div>
        )}

        {/* Stats bar */}
        {!loading && !error && grants.length > 0 && (
          <div className="flex items-center gap-6 p-4 glass rounded-xl text-xs text-white/40">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              {grants.length} total grant programs
            </div>
            <div>
              {grants.reduce((sum, g) => sum + parseInt(g.remaining_budget), 0).toLocaleString()} GEN available
            </div>
            <div>
              {grants.reduce((sum, g) => sum + g.funded_count, 0)} projects funded
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
