"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Zap,
  Shield,
  Brain,
  TrendingUp,
  ChevronRight,
  Globe,
  Lock,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  { label: "Total Grants", value: 2400000, suffix: " GEN" },
  { label: "Proposals Evaluated", value: 847, suffix: "" },
  { label: "Projects Funded", value: 134, suffix: "" },
  { label: "Avg Consensus Score", value: 94, suffix: "%" },
];

const features = [
  {
    icon: Brain,
    title: "AI-Assisted Evaluation",
    description: "Proposals are evaluated by LLM-powered validators using GenLayer's subjective consensus — no human bias, full transparency.",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Shield,
    title: "Optimistic Democracy",
    description: "Leader validators propose decisions, peers independently verify. Consensus requires supermajority agreement — fair and decentralized.",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Lock,
    title: "Trustless Escrow",
    description: "GEN tokens locked in on-chain escrow contracts. Funding released automatically upon milestone verification.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Globe,
    title: "Real-World Verification",
    description: "Validators can fetch live URLs to verify milestone completions — AI reads GitHub repos, demos, and reports.",
    color: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
  },
];

const workflow = [
  { step: "01", title: "Sponsor Creates Grant", desc: "Deposit GEN into escrow, define criteria and focus areas" },
  { step: "02", title: "Teams Submit Proposals", desc: "Multi-step submission with team info, roadmap, and impact" },
  { step: "03", title: "AI Validators Evaluate", desc: "GenLayer's LLM nodes assess merit via subjective consensus" },
  { step: "04", title: "Consensus Reached", desc: "Optimistic democracy finalizes approval or rejection on-chain" },
  { step: "05", title: "Milestones & Payouts", desc: "Funding released in tranches as deliverables are verified" },
];

const categories = [
  { name: "Ecosystem Grants", count: 12, color: "text-blue-400" },
  { name: "AI Research", count: 8, color: "text-purple-400" },
  { name: "Infrastructure", count: 15, color: "text-emerald-400" },
  { name: "Startup Incubators", count: 6, color: "text-orange-400" },
  { name: "Open Source", count: 21, color: "text-cyan-400" },
  { name: "Education", count: 9, color: "text-pink-400" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-8 border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold">Foster</span>
        </div>
        <div className="flex items-center gap-8 mx-auto">
          {["Grants", "How It Works", "Analytics", "Docs"].map((item) => (
            <a key={item} href="#" className="text-sm text-white/50 hover:text-white transition-colors">{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/grants"><Button variant="ghost" size="sm">Browse Grants</Button></Link>
          <Link href="/dashboard"><Button size="sm">Launch App</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-8 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-[400px] h-[300px] rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Powered by GenLayer StudioNet · Chain ID 61999
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-6xl font-bold leading-tight tracking-tight mb-6">
            Merit-Based Funding<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Powered by AI Consensus
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Foster replaces subjective committees with transparent, AI-assisted validator consensus.
            Every grant decision is made on-chain, auditable, and fair.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/grants"><Button size="lg">Browse Open Grants <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/proposals/submit"><Button variant="secondary" size="lg">Submit Proposal</Button></Link>
          </div>
          <div className="mt-12 inline-flex items-center gap-2 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Live on GenLayer StudioNet · RPC: studio.genlayer.com/api
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-4">
          {stats.map(({ label, value, suffix }) => (
            <div key={label} className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <div className="text-sm text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Why <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Foster</span></h2>
            <p className="text-white/40">Built on GenLayer&apos;s unique ability to handle subjective decisions on-chain</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, description, color, border, iconColor }) => (
              <div key={title} className={`relative overflow-hidden rounded-xl p-6 border ${border} bg-gradient-to-br ${color} glass-hover`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-8 pb-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-white/40">From grant creation to funded milestones in 5 steps</p>
          </div>
          <div className="relative">
            <div className="absolute left-[28px] top-8 bottom-8 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent" />
            <div className="space-y-6">
              {workflow.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-6 items-start">
                  <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white/60">{step}</span>
                  </div>
                  <div className="glass rounded-xl p-5 flex-1 glass-hover">
                    <div className="font-semibold text-white mb-1">{title}</div>
                    <div className="text-sm text-white/50">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Open Grant Programs</h2>
              <p className="text-sm text-white/40">Explore funding opportunities across categories</p>
            </div>
            <Link href="/grants"><Button variant="secondary" size="sm">View All <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(({ name, count, color }) => (
              <Link href="/grants" key={name}>
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer">
                  <div className={`text-sm font-medium ${color} mb-1`}>{name}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-xs text-white/30">active grants</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-12 text-center bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-white/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 blur-[60px] rounded-full" />
            <div className="relative">
              <Coins className="w-10 h-10 mx-auto mb-4 text-blue-400" />
              <h2 className="text-3xl font-bold mb-4">Ready to get funded?</h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Submit your proposal today and let GenLayer&apos;s AI consensus evaluate your project on its merits.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/proposals/submit"><Button size="lg">Submit a Proposal <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link href="/dashboard"><Button variant="secondary" size="lg"><TrendingUp className="w-4 h-4" />View Dashboard</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white/60">Foster</span>
          </div>
          <div className="text-xs text-white/30">Built on GenLayer StudioNet · Powered by Optimistic Democracy</div>
        </div>
      </footer>
    </div>
  );
}
