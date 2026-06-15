"use client";
import { ProposalStatus, MilestoneStatus } from "@/lib/types";

const proposalStyles: Record<ProposalStatus, string> = {
  PENDING: "badge-amber",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
  REVISION_REQUESTED: "badge-purple",
  APPEALED: "badge-blue",
  FUNDED: "badge-blue",
  COMPLETED: "badge-green",
};

const proposalLabels: Record<ProposalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_REQUESTED: "Revision Requested",
  APPEALED: "Appealed",
  FUNDED: "Funded",
  COMPLETED: "Completed",
};

const milestoneStyles: Record<MilestoneStatus, string> = {
  PENDING: "badge-gray",
  PROOF_SUBMITTED: "badge-amber",
  VERIFIED: "badge-green",
  REJECTED: "badge-red",
  PAID: "badge-green",
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
  const style = type === "proposal"
    ? proposalStyles[status as ProposalStatus]
    : milestoneStyles[status as MilestoneStatus];
  const label = type === "proposal"
    ? proposalLabels[status as ProposalStatus]
    : milestoneLabels[status as MilestoneStatus];

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${style} ${
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
    }`}>
      {label}
    </span>
  );
}
