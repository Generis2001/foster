"use client";
import { FosterLogo } from "./FosterLogo";

export function CoBrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const config = {
    sm: { logoH: 26, gap: "gap-1.5", gl: "text-[13px]", plus: "text-[15px] mx-1", foster: "text-[13px] ml-1" },
    md: { logoH: 32, gap: "gap-2",   gl: "text-[15px]", plus: "text-[17px] mx-1.5", foster: "text-[15px] ml-1.5" },
    lg: { logoH: 40, gap: "gap-2.5", gl: "text-[18px]", plus: "text-[20px] mx-2",   foster: "text-[18px] ml-2" },
  }[size];

  return (
    <div className={`flex items-center ${config.gap}`}>
      {/* GenLayer — Recoleta: warm humanist serif */}
      <span
        className={`wordmark-genlayer ${config.gl} text-[#0E2D6B]`}
        style={{ lineHeight: 1 }}
      >
        GenLayer
      </span>

      <span
        className={`${config.plus} text-gray-300 font-light`}
        style={{ lineHeight: 1 }}
      >
        +
      </span>

      <FosterLogo height={config.logoH} />

      {/* Foster — Nunito: rounded modern sans */}
      <span
        className={`wordmark-foster ${config.foster} text-[#0E2D6B]`}
        style={{ lineHeight: 1 }}
      >
        Foster
      </span>
    </div>
  );
}
