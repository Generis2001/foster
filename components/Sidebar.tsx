"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Coins, FileText, Shield, BarChart3, CheckSquare, Zap, Plus } from "lucide-react";

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
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900">Foster</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Create grant CTA */}
      <div className="px-3 pb-5">
        <Link href="/grants/create">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Create Grant</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
