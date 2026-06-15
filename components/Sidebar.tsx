"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  FileText,
  Shield,
  BarChart3,
  CheckSquare,
  Zap,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/grants", icon: Coins, label: "Discover Grants" },
  { href: "/proposals/submit", icon: FileText, label: "Submit Proposal" },
  { href: "/validator", icon: Shield, label: "Validator Hub" },
  { href: "/milestones", icon: CheckSquare, label: "Milestones" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r border-white/[0.06] bg-[#050508]/80 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white">Foster</span>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Beta
        </span>
      </div>

      {/* Network indicator */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-white/50">GenLayer StudioNet</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-white/[0.08] text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-400" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 space-y-2">
        <a
          href="https://studio.genlayer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          GenLayer Studio
        </a>
        <div className="px-3 text-[10px] text-white/20">
          Chain ID: 61999 · GEN
        </div>
      </div>
    </aside>
  );
}
