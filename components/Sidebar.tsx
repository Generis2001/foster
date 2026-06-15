"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Coins, FileText, Shield, BarChart3, CheckSquare, Plus } from "lucide-react";
import { FosterLogo } from "@/components/FosterLogo";

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
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-gray-100 bg-white z-40">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100 hover:opacity-80 transition-opacity">
        <FosterLogo height={28} />
        <span className="wordmark-foster text-[14px] text-[#0E2D6B]">Foster</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold tracking-[-0.01em] transition-all duration-100 ${
                active
                  ? "bg-[#0E2D6B]/8 text-[#0E2D6B]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#0E2D6B]" : "text-gray-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Create grant CTA */}
      <div className="px-2.5 pb-5">
        <Link href="/grants/create">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0E2D6B] hover:bg-[#163a87] active:bg-[#0a2057] transition-colors cursor-pointer shadow-[0_1px_3px_rgba(14,45,107,0.3)]">
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="text-[13px] font-semibold text-white tracking-[-0.01em]">Create Grant</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
