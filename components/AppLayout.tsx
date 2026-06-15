"use client";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fc]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-56">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
