"use client";
import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Grant } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CONTRACTS, readContract, requireAddress, fromWei } from "@/lib/genlayer";
import {
  Search, Filter, Coins, Clock, ArrowRight, TrendingUp,
  Loader2, AlertTriangle, Plus, X,
} from "lucide-react";

const CATEGORIES = [
  "All", "AI", "Infrastructure", "Open Source",
  "Education", "DeFi", "Research", "Developer Tools",
];

const STATUSES = ["All", "ACTIVE", "PAUSED", "CLOSED"];

interface Filters {
  status: string;
  minBudget: string;
  maxBudget: string;
  deadlineBefore: string;
}

const DEFAULT_FILTERS: Filters = { status: "All", minBudget: "", maxBudget: "", deadlineBefore: "" };

function activeFilterCount(f: Filters) {
  return [
    f.status !== "All",
    f.minBudget !== "",
    f.maxBudget !== "",
    f.deadlineBefore !== "",
  ].filter(Boolean).length;
}

function GrantCard({ grant }: { grant: Grant }) {
  const focusAreas = grant.focus_areas.split(",");
  const totalBudget = fromWei(grant.total_budget);
  const remaining = fromWei(grant.remaining_budget);
  const maxGrant = fromWei(grant.max_grant_size);
  const pct = totalBudget > 0 ? Math.round(((totalBudget - remaining) / totalBudget) * 100) : 0;

  return (
    <div className="card card-hover p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Coins className="w-5 h-5 text-blue-600" />
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
          grant.status === "ACTIVE" ? "badge-green" : "badge-gray"
        }`}>
          {grant.status}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-1.5">{grant.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{grant.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {focusAreas.slice(0, 3).map((area) => (
          <span key={area} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            {area.trim()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center py-3 border-y border-gray-100">
        <div>
          <div className="text-sm font-semibold text-gray-900">{maxGrant.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Max GEN</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{grant.proposal_count}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Proposals</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{grant.funded_count}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Funded</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{remaining.toLocaleString()} GEN remaining</span>
          <span>{pct}% allocated</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!CONTRACTS.grantManager) {
        setError("Contracts not deployed yet. Deploy GrantManager.py to GenLayer Studio first.");
        setLoading(false);
        return;
      }
      const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
      try {
        const count = (await readContract(gmAddr, "get_grant_count", [])) as bigint;
        const ids = Array.from({ length: Number(count) }, (_, i) => `grant_${i}`);
        const results = await Promise.all(
          ids.map(async (id) => {
            const json = await readContract(gmAddr, "get_grant", [id]);
            if (!json || json === "") return null;
            return JSON.parse(json as string) as Grant;
          })
        );
        setGrants(results.filter(Boolean) as Grant[]);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const filtered = grants.filter((g) => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) &&
        !g.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "All" && !g.focus_areas.toLowerCase().includes(category.toLowerCase())) return false;
    if (filters.status !== "All" && g.status !== filters.status) return false;
    const remaining = fromWei(g.remaining_budget);
    if (filters.minBudget !== "" && remaining < parseFloat(filters.minBudget)) return false;
    if (filters.maxBudget !== "" && remaining > parseFloat(filters.maxBudget)) return false;
    if (filters.deadlineBefore !== "") {
      const deadlineTs = parseInt(g.deadline) * 1000;
      const beforeTs = new Date(filters.deadlineBefore).getTime();
      if (deadlineTs > beforeTs) return false;
    }
    return true;
  });

  const numActiveFilters = activeFilterCount(filters);

  return (
    <AppLayout title="Discover Grants">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grant Programs</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading..." : `${grants.length} grants on GenLayer StudioNet`}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search grants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-sm ${
                numActiveFilters > 0 || filterOpen
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {numActiveFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {numActiveFilters}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-gray-100 bg-white shadow-lg z-50 p-4 space-y-5">
                {/* Status */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateFilter("status", s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          filters.status === s
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {s === "All" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget remaining */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Budget Remaining (GEN)</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minBudget}
                      onChange={(e) => updateFilter("minBudget", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <span className="text-gray-400 text-xs flex-shrink-0">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxBudget}
                      onChange={(e) => updateFilter("maxBudget", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deadline On or Before</div>
                  <input
                    type="date"
                    value={filters.deadlineBefore}
                    onChange={(e) => updateFilter("deadlineBefore", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                {/* Clear */}
                {numActiveFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                category === cat
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading grants from GenLayer StudioNet...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm mb-1">Contract Not Connected</div>
              <div className="text-xs text-amber-600">{error}</div>
              <div className="text-xs text-amber-500 mt-2">
                Set NEXT_PUBLIC_GRANT_MANAGER_ADDRESS in .env.local after deploying via GenLayer Studio.
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-gray-500 mb-1 font-medium">No grants found</div>
            <div className="text-sm text-gray-400">
              {grants.length === 0
                ? "Be the first to create a grant program on Foster."
                : "Try adjusting your search or filters."}
            </div>
            {grants.length === 0 ? (
              <Link href="/grants/create" className="mt-4 inline-block">
                <Button size="sm"><Plus className="w-3.5 h-3.5" /> Create First Grant</Button>
              </Link>
            ) : (
              <button onClick={() => { setSearch(""); setCategory("All"); clearFilters(); }} className="mt-4 text-sm text-blue-600 hover:underline font-medium">
                Clear all filters
              </button>
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

        {!loading && !error && grants.length > 0 && (
          <div className="flex items-center gap-6 p-4 card rounded-xl text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              {filtered.length === grants.length
                ? `${grants.length} total grant programs`
                : `${filtered.length} of ${grants.length} grants`}
            </div>
            <div>
              {grants.reduce((sum, g) => sum + fromWei(g.remaining_budget), 0).toLocaleString()} GEN available
            </div>
            <div>{grants.reduce((sum, g) => sum + g.funded_count, 0)} projects funded</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
