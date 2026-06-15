"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Zap, Shield, Brain, TrendingUp, Globe, Lock, Coins, CheckCircle } from "lucide-react";

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

const stats = [
  { label: "GEN Available", value: 2400000, prefix: "", suffix: "+" },
  { label: "Proposals Evaluated", value: 847, prefix: "", suffix: "" },
  { label: "Projects Funded", value: 134, prefix: "", suffix: "" },
  { label: "Consensus Accuracy", value: 94, prefix: "", suffix: "%" },
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
  { step: "1", title: "Create a Grant Program", desc: "Deposit GEN into escrow and define your funding criteria, focus areas, and eligibility requirements." },
  { step: "2", title: "Teams Submit Proposals", desc: "Builders apply with a structured proposal: team info, roadmap, requested amount, and impact statement." },
  { step: "3", title: "AI Validators Evaluate", desc: "GenLayer's LLM validators independently assess each proposal and reach consensus on merit scores." },
  { step: "4", title: "Consensus Decides", desc: "Optimistic democracy produces an on-chain, auditable APPROVE / REJECT / REVISION decision for every proposal." },
  { step: "5", title: "Milestone-Based Payouts", desc: "Approved teams submit proof of delivery. AI verifies completions and releases GEN in tranches." },
];

const categories = [
  { name: "Ecosystem Grants", count: 12, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "AI Research", count: 8, color: "text-violet-600", bg: "bg-violet-50" },
  { name: "Infrastructure", count: 15, color: "text-emerald-600", bg: "bg-emerald-50" },
  { name: "Startup Incubators", count: 6, color: "text-orange-600", bg: "bg-orange-50" },
  { name: "Open Source", count: 21, color: "text-cyan-600", bg: "bg-cyan-50" },
  { name: "Education", count: 9, color: "text-pink-600", bg: "bg-pink-50" },
];

const trustItems = [
  "Every decision is on-chain and auditable",
  "No committees, no hidden bias",
  "AI consensus with full validator reasoning",
  "Milestone-gated funding — no rug pulls",
];

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Foster</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {["Grants", "How It Works", "Analytics"].map((item) => (
              <a key={item} href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/grants" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Browse Grants
            </Link>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#f7f8fc] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-7 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Now Live on GenLayer StudioNet
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-6 max-w-3xl mx-auto">
            Merit-based funding,{" "}
            <span className="gradient-text">decided by AI consensus</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Foster replaces grant committees with transparent, on-chain AI evaluation.
            Every funding decision is auditable, fair, and verifiable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link href="/grants" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2 text-sm">
              Browse Open Grants <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/proposals/submit" className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-lg border border-gray-200 transition-colors text-sm">
              Submit a Proposal
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trustItems.map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value, prefix, suffix }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                <AnimatedCounter target={value} prefix={prefix} suffix={suffix} />
              </div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Foster?</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Built on GenLayer&apos;s unique ability to run subjective AI decisions on-chain with validator consensus.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
              <div key={title} className="card card-hover p-6 flex gap-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-[#f7f8fc] border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">From grant creation to funded milestones in five clear steps.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {workflow.map(({ step, title, desc }) => (
              <div key={step} className="card p-5 flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grant Categories */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Open Grant Programs</h2>
              <p className="text-gray-500 text-sm">Explore active funding across every category.</p>
            </div>
            <Link href="/grants" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(({ name, count, color, bg }) => (
              <Link href="/grants" key={name}>
                <div className="card card-hover p-5 cursor-pointer">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${color} text-xs font-semibold mb-3`}>
                    {name}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-400 mt-0.5">active grants</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-6xl mx-auto text-center">
          <Coins className="w-10 h-10 mx-auto mb-5 text-blue-200" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get funded?</h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto leading-relaxed">
            Submit your proposal and let GenLayer&apos;s AI consensus evaluate your project purely on merit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/proposals/submit" className="bg-white hover:bg-gray-50 text-blue-700 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2 text-sm">
              Submit a Proposal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg border border-blue-400 transition-colors flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" /> View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">Foster</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            {["Grants", "Dashboard", "Analytics"].map((l) => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-gray-600 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-xs text-gray-400">Powered by GenLayer · Optimistic Democracy</div>
        </div>
      </footer>
    </div>
  );
}
