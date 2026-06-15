"use client";
import { FosterLogo } from "./FosterLogo";

export function CoBrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const config = {
    sm: { logoH: 28, divider: "text-gray-300 text-lg mx-1.5", gl: "text-sm", foster: "text-sm" },
    md: { logoH: 36, divider: "text-gray-300 text-xl mx-2", gl: "text-base", foster: "text-base" },
    lg: { logoH: 44, divider: "text-gray-300 text-2xl mx-2.5", gl: "text-lg", foster: "text-lg" },
  }[size];

  return (
    <div className="flex items-center gap-0">
      {/* GenLayer wordmark — Recoleta style: warm, humanist serif */}
      <span
        className={`wordmark-genlayer ${config.gl} text-gray-900`}
        style={{ lineHeight: 1 }}
      >
        GenLayer
      </span>

      {/* Divider */}
      <span className={config.divider} style={{ lineHeight: 1, fontWeight: 300 }}>+</span>

      {/* Foster logo mark (just the icon, no text) */}
      <FosterLogo height={config.logoH} />

      {/* Foster wordmark — Nunito style: rounded, modern sans */}
      <span
        className={`wordmark-foster ${config.foster} text-gray-900 ml-1.5`}
        style={{ lineHeight: 1 }}
      >
        Foster
      </span>
    </div>
  );
}
