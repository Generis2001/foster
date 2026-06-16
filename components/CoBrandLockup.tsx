"use client";
import { FosterLogo } from "./FosterLogo";

export function CoBrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const config = {
    sm: { logoH: 26, gap: "gap-1.5", foster: "text-[13px] ml-1" },
    md: { logoH: 32, gap: "gap-2",   foster: "text-[15px] ml-1.5" },
    lg: { logoH: 40, gap: "gap-2.5", foster: "text-[18px] ml-2" },
  }[size];

  return (
    <div className={`flex items-center ${config.gap}`}>
      <FosterLogo height={config.logoH} />
      <span
        className={`wordmark-foster ${config.foster} text-[#0E2D6B]`}
        style={{ lineHeight: 1 }}
      >
        Foster
      </span>
    </div>
  );
}
