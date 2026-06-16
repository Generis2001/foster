"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Shield, Brain, TrendingUp, Globe, Lock, Coins, CheckCircle } from "lucide-react";
import { CoBrandLockup } from "@/components/CoBrandLockup";
import { FosterLogo } from "@/components/FosterLogo";
import { CONTRACTS, readContract, requireAddress, fromWei } from "@/lib/genlayer";
import { Grant, Proposal } from "@/lib/types";

function AnimatedCounter({ target, duration = 2000, suffix = "", prefix = "" }: { target: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

interface ChainStats {
  genAvailable: number;
  proposalCount: number;
  fundedCount: number;
  activeGrants: number;
  grants: Grant[];
}

async function fetchChainStats(): Promise<ChainStats> {
  let genAvailable = 0;
  let proposalCount = 0;
  let fundedCount = 0;
  let activeGrants = 0;
  let grants: Grant[] = [];

  try {
    if (CONTRACTS.grantManager) {
      const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
      const count = (await readContract(gmAddr, "get_grant_count", [])) as bigint;
      const ids = Array.from({ length: Number(count) }, (_, i) => `grant_${i}`);
      grants = (await Promise.all(ids.map(async (id) => {
        const json = await readContract(gmAddr, "get_grant", [id]);
        if (!json || json === "") return null;
        return JSON.parse(json as string) as Grant;
      }))).filter(Boolean) as Grant[];
      genAvailable = grants.reduce((s, g) => s + fromWei(g.remaining_budget), 0);
      fundedCount = grants.reduce((s, g) => s + g.funded_count, 0);
      activeGrants = grants.filter(g => g.status === "ACTIVE").length;
    }
  } catch { /* ignore */ }

  try {
    if (CONTRACTS.proposalManager) {
      const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
      const c = (await readContract(pmAddr, "get_proposal_count", [])) as bigint;
      proposalCount = Number(c);
    }
  } catch { /* ignore */ }

  return { genAvailable, proposalCount, fundedCount, activeGrants, grants };
}

const CARD_PALETTES = [
  { color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500", bar: "bg-blue-500" },
  { color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500", bar: "bg-violet-500" },
  { color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500", bar: "bg-orange-500" },
  { color: "text-cyan-600", bg: "bg-cyan-50", dot: "bg-cyan-500", bar: "bg-cyan-500" },
  { color: "text-pink-600", bg: "bg-pink-50", dot: "bg-pink-500", bar: "bg-pink-500" },
];

const features = [
  {
    icon: Brain,
    title: "AI-Assisted Evaluation",
    description: "Proposals are scored by LLM-powered validators using GenLayer's subjective consensus — no committees, no bias, full transparency.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Shield,
    title: "Optimistic Democracy",
    description: "A leader validator proposes a decision. Peers independently verify. Supermajority consensus finalizes every result on-chain.",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: Lock,
    title: "Trustless Escrow",
    description: "GEN tokens are locked in smart contracts and released automatically when milestones are verified — no manual approvals.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Globe,
    title: "Real-World Verification",
    description: "Validators fetch live URLs, GitHub releases, and demos to verify milestone completions before releasing any funds.",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

const workflow = [
  { step: "01", title: "Create a Grant Program", desc: "Deposit GEN into escrow and define your funding criteria, focus areas, and eligibility requirements." },
  { step: "02", title: "Teams Submit Proposals", desc: "Builders apply with a structured proposal: team info, roadmap, requested amount, and impact statement." },
  { step: "03", title: "AI Validators Evaluate", desc: "GenLayer's LLM validators independently assess each proposal and reach consensus on merit scores." },
  { step: "04", title: "Consensus Decides", desc: "Optimistic democracy produces an on-chain, auditable APPROVE / REJECT / REVISION decision for every proposal." },
  { step: "05", title: "Milestone-Based Payouts", desc: "Approved teams submit proof of delivery. AI verifies completions and releases GEN in tranches." },
];

const trustItems = [
  "Every decision is on-chain and auditable",
  "No committees, no hidden bias",
  "AI consensus with full validator reasoning",
  "Milestone-gated funding — no rug pulls",
];

export default function HomePage() {
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);

  useEffect(() => {
    fetchChainStats().then(setChainStats).catch(() => {});
  }, []);

  const activeGrants = (chainStats?.grants ?? []).filter(g => g.status === "ACTIVE").slice(0, 6);

  const stats = chainStats
    ? [
        { label: "GEN Available", value: chainStats.genAvailable, suffix: "" },
        { label: "Total Proposals", value: chainStats.proposalCount, suffix: "" },
        { label: "Projects Funded", value: chainStats.fundedCount, suffix: "" },
        { label: "Active Grants", value: chainStats.activeGrants, suffix: "" },
      ]
    : [
        { label: "GEN Available", value: 0, suffix: "" },
        { label: "Total Proposals", value: 0, suffix: "" },
        { label: "Projects Funded", value: 0, suffix: "" },
        { label: "Active Grants", value: 0, suffix: "" },
      ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <CoBrandLockup size="md" />

          <div className="hidden md:flex items-center gap-7">
            {["Grants", "How It Works", "Analytics"].map((item) => (
              <a key={item} href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors tracking-[-0.01em]">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/grants" className="hidden md:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors tracking-[-0.01em]">
              Browse Grants
            </Link>
            <Link
              href="/dashboard"
              className="bg-[#0E2D6B] hover:bg-[#163a87] active:bg-[#0a2057] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-[0_1px_3px_rgba(14,45,107,0.35)] tracking-[-0.01em]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#f8f9fb] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 mb-8 shadow-sm tracking-[-0.01em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Now Live on GenLayer StudioNet
          </div>

          <h1 className="text-5xl md:text-[60px] font-bold leading-[1.08] tracking-[-0.035em] text-[#0d1117] mb-6 max-w-3xl mx-auto">
            Merit-based funding,{" "}
            <span className="gradient-text">decided by AI consensus.</span>
          </h1>

          <p className="text-[17px] text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Foster replaces grant committees with transparent, on-chain AI evaluation.
            Every funding decision is auditable, fair, and verifiable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/grants"
              className="bg-[#0E2D6B] hover:bg-[#163a87] text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-[0_1px_3px_rgba(14,45,107,0.35)] tracking-[-0.01em]"
            >
              Browse Open Grants <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/proposals/submit"
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-colors text-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] tracking-[-0.01em]"
            >
              Submit a Proposal
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trustItems.map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
          {stats.map(({ label, value, suffix }) => (
            <div key={label} className="text-center px-4">
              <div className="text-[32px] font-bold text-[#0d1117] mb-1 tracking-[-0.04em]">
                {!chainStats ? (
                  <span className="text-gray-300">—</span>
                ) : (
                  <AnimatedCounter target={value} suffix={suffix} />
                )}
              </div>
              <div className="text-sm text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-4 tracking-[0.02em] uppercase">
              Why Foster
            </div>
            <h2 className="text-4xl font-bold text-[#0d1117] mb-3 tracking-[-0.03em]">Built different</h2>
            <p className="text-gray-500 max-w-md mx-auto font-medium leading-relaxed">
              GenLayer's unique ability to run subjective AI decisions on-chain with validator consensus.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
              <div key={title} className="card card-hover p-6 flex gap-4">
                <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1117] mb-1.5 tracking-[-0.02em]">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-[#f8f9fb] border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold mb-4 tracking-[0.02em] uppercase">
              Process
            </div>
            <h2 className="text-4xl font-bold text-[#0d1117] mb-3 tracking-[-0.03em]">How It Works</h2>
            <p className="text-gray-500 font-medium">From grant creation to funded milestones in five clear steps.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {workflow.map(({ step, title, desc }) => (
              <div key={step} className="card p-5 flex gap-5 items-start group hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-[#0E2D6B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 tracking-wide shadow-[0_1px_3px_rgba(14,45,107,0.3)]">
                  {step}
                </div>
                <div>
                  <div className="font-bold text-[#0d1117] mb-1 tracking-[-0.02em]">{title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Grant Programs */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-[#0d1117] mb-2 tracking-[-0.03em]">Open Grant Programs</h2>
              <p className="text-gray-500 text-sm font-medium">
                {chainStats
                  ? activeGrants.length > 0
                    ? `${activeGrants.length} active program${activeGrants.length !== 1 ? "s" : ""} on GenLayer StudioNet`
                    : "No active grant programs yet — be the first to create one."
                  : "Loading from GenLayer StudioNet..."}
              </p>
            </div>
            <Link href="/grants" className="text-sm font-semibold text-[#0E2D6B] hover:text-[#163a87] flex items-center gap-1 transition-colors tracking-[-0.01em]">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!chainStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-6 w-24 rounded-full bg-gray-100 mb-4" />
                  <div className="h-5 w-32 rounded bg-gray-100 mb-2" />
                  <div className="h-4 w-full rounded bg-gray-100 mb-1" />
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {chainStats && activeGrants.length === 0 && (
            <div className="text-center py-16 card rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 font-medium mb-1">No open grants yet</div>
              <div className="text-sm text-gray-400 mb-4">Create the first grant program on Foster.</div>
              <Link
                href="/grants/create"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E2D6B] hover:text-[#163a87] transition-colors"
              >
                Create a Grant Program <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {chainStats && activeGrants.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeGrants.map((grant, i) => {
                const palette = CARD_PALETTES[i % CARD_PALETTES.length];
                const areas = grant.focus_areas.split(",").map(s => s.trim()).filter(Boolean);
                const remaining = fromWei(grant.remaining_budget);
                const total = fromWei(grant.total_budget);
                const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
                return (
                  <Link href={`/proposals/submit?grant=${grant.id}`} key={grant.id}>
                    <div className="card card-hover p-5 cursor-pointer h-full flex flex-col gap-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${palette.bg} ${palette.color} text-xs font-bold self-start tracking-[-0.01em]`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
                        {areas[0] || "Grant"}
                      </div>
                      <div className="font-bold text-[#0d1117] text-sm leading-snug tracking-[-0.02em]">{grant.name}</div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium flex-1">{grant.description}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{remaining.toLocaleString()} GEN left</span>
                          <span>{pct}% allocated</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${palette.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-[0.04em]">
                        <span>{grant.proposal_count} proposal{grant.proposal_count !== 1 ? "s" : ""}</span>
                        <span>Max {fromWei(grant.max_grant_size).toLocaleString()} GEN</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#0E2D6B]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Coins className="w-6 h-6 text-white/80" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-[-0.03em]">Ready to get funded?</h2>
          <p className="text-blue-200 mb-8 max-w-md mx-auto leading-relaxed font-medium">
            Submit your proposal and let GenLayer's AI consensus evaluate your project purely on merit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/proposals/submit"
              className="bg-white hover:bg-gray-50 text-[#0E2D6B] font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)] tracking-[-0.01em]"
            >
              Submit a Proposal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl border border-white/20 transition-colors flex items-center gap-2 text-sm tracking-[-0.01em]"
            >
              <TrendingUp className="w-4 h-4" /> View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FosterLogo height={22} />
            <span className="wordmark-foster text-[13px] text-[#0E2D6B]">Foster</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-gray-400 font-semibold">
            {["Grants", "Dashboard", "Analytics"].map((l) => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-gray-700 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-xs text-gray-400 font-medium">Powered by GenLayer · Optimistic Democracy</div>
        </div>
      </footer>
    </div>
  );
}
