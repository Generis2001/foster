"use client";
import { ProposalStatus, MilestoneStatus } from "@/lib/types";

const proposalColors: Record<ProposalStatus, string> = {
  PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  APPROVED: "text-green-400 bg-green-400/10 border-green-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border-red-400/20",
  REVISION_REQUESTED: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  APPEALED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  FUNDED: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  COMPLETED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const proposalLabels: Record<ProposalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_REQUESTED: "Revision",
  APPEALED: "Appealed",
  FUNDED: "Funded",
  COMPLETED: "Completed",
};

const milestoneColors: Record<MilestoneStatus, string> = {
  PENDING: "text-white/40 bg-white/5 border-white/10",
  PROOF_SUBMITTED: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  VERIFIED: "text-green-400 bg-green-400/10 border-green-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border-red-400/20",
  PAID: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const milestoneLabels: Record<MilestoneStatus, string> = {
  PENDING: "Pending",
  PROOF_SUBMITTED: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  PAID: "Paid",
};

interface StatusBadgeProps {
  status: ProposalStatus | MilestoneStatus;
  type?: "proposal" | "milestone";
  size?: "sm" | "md";
}

export function StatusBadge({ status, type = "proposal", size = "md" }: StatusBadgeProps) {
  const colors =
    type === "proposal"
      ? proposalColors[status as ProposalStatus]
      : milestoneColors[status as MilestoneStatus];
  const label =
    type === "proposal"
      ? proposalLabels[status as ProposalStatus]
      : milestoneLabels[status as MilestoneStatus];

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-medium ${colors} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
