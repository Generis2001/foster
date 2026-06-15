"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { CONTRACTS, readContract } from "@/lib/genlayer";
import { useSubmitMilestoneProof, useVerifyMilestone } from "@/lib/hooks";
import { Proposal, Milestone } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  CheckSquare, Loader2, AlertTriangle, Wallet,
  CheckCircle, XCircle, Upload, Zap, ExternalLink,
} from "lucide-react";
import { STUDIONET_CHAIN } from "@/lib/genlayer";

interface ProposalWithMilestones {
  proposal: Proposal;
  milestones: Milestone[];
}

export default function MilestonesPage() {
  const { connected, connect, connecting, address } = useWallet();
  const [data, setData] = useState<ProposalWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMs, setSelectedMs] = useState<Milestone | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofDesc, setProofDesc] = useState("");
  const [showProofForm, setShowProofForm] = useState(false);

  const { submit: submitProof, loading: proofLoading, error: proofError } = useSubmitMilestoneProof();
  const { verify, loading: verifyLoading, error: verifyError, txHash: verifyTxHash } = useVerifyMilestone();

  async function load() {
    if (!CONTRACTS.proposalManager || !CONTRACTS.milestoneManager) {
      setLoading(false);
      return;
    }
    try {
      const count = (await readContract(CONTRACTS.proposalManager, "get_proposal_count", [])) as bigint;
      const propIds = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);

      const results = await Promise.all(
        propIds.map(async (pid) => {
          const pJson = await readContract(CONTRACTS.proposalManager, "get_proposal", [pid]);
          if (!pJson || pJson === "") return null;
          const proposal = JSON.parse(pJson as string) as Proposal;

          if (address && proposal.proposer.toLowerCase() !== address.toLowerCase()) return null;

          let msIds: string[] = [];
          try {
            msIds = (await readContract(CONTRACTS.milestoneManager, "get_milestones_for_proposal", [pid])) as string[];
          } catch {
            msIds = [];
          }
          const milestones = await Promise.all(
            msIds.map(async (mid) => {
              const mJson = await readContract(CONTRACTS.milestoneManager, "get_milestone", [mid]);
              return JSON.parse(mJson as string) as Milestone;
            })
          );

          if (milestones.length === 0) return null;
          return { proposal, milestones };
        })
      );

      setData(results.filter(Boolean) as ProposalWithMilestones[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [address]);

  return (
    <AppLayout title="Milestones">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Milestone Verification</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Submit proof of completion and trigger AI verification on-chain
            </p>
          </div>
          {!connected && (
            <Button size="sm" onClick={connect} disabled={connecting}>
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              Connect Wallet
            </Button>
          )}
        </div>

        {!CONTRACTS.milestoneManager && (
          <div className="flex items-center gap-3 p-4 card border-l-4 border-l-amber-400 text-amber-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            MilestoneManager contract not configured. Set NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS in .env.local
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading milestones from chain...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-gray-500 font-medium mb-1">No milestones found</div>
            <div className="text-sm text-gray-400">
              {!connected
                ? "Connect your wallet to view your milestones."
                : "No milestones for your approved proposals yet."}
            </div>
          </div>
        )}

        {data.map(({ proposal, milestones }) => (
          <div key={proposal.id} className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{proposal.title}</h2>
                <div className="text-xs text-gray-400 mt-0.5">{proposal.id} · {parseInt(proposal.requested_amount).toLocaleString()} GEN</div>
              </div>
              <StatusBadge status={proposal.status} size="sm" />
            </div>

            <div className="space-y-3">
              {milestones.map((ms) => (
                <div key={ms.id} className="border border-gray-200 rounded-xl p-5 space-y-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm mb-1">{ms.title}</div>
                      <div className="text-xs text-gray-500 mb-2">{ms.description}</div>
                      <div className="text-xs text-gray-400">Success criteria: {ms.success_criteria}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">{parseInt(ms.amount).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">GEN</div>
                      <div className="mt-1"><StatusBadge status={ms.status} type="milestone" size="sm" /></div>
                    </div>
                  </div>

                  {ms.proof_url && (
                    <div className="p-3 rounded-lg bg-white border border-gray-200 text-xs">
                      <div className="text-gray-400 mb-1">Proof submitted:</div>
                      <a href={ms.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {ms.proof_url} <ExternalLink className="w-3 h-3" />
                      </a>
                      {ms.proof_description && <div className="text-gray-500 mt-1">{ms.proof_description}</div>}
                    </div>
                  )}

                  {ms.verification_result && (
                    <div className={`p-3 rounded-lg border text-xs ${
                      ms.verification_result.verified
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-200 text-red-600"
                    }`}>
                      <div className="flex items-center gap-2 font-medium mb-1">
                        {ms.verification_result.verified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {ms.verification_result.verified ? "Verified" : "Rejected"} · {ms.verification_result.confidence}% confidence
                      </div>
                      <div>{ms.verification_result.reasoning}</div>
                      {ms.verification_result.feedback && (
                        <div className="mt-1 opacity-70">{ms.verification_result.feedback}</div>
                      )}
                    </div>
                  )}

                  {ms.status === "PENDING" && connected && (
                    <>
                      {selectedMs?.id === ms.id && showProofForm ? (
                        <div className="space-y-3 p-4 rounded-xl bg-white border border-gray-200">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5 font-medium">Proof URL</label>
                            <input
                              type="url"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              placeholder="https://github.com/your-repo/releases/v1.0"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-400 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5 font-medium">Description</label>
                            <textarea
                              value={proofDesc}
                              onChange={(e) => setProofDesc(e.target.value)}
                              placeholder="Describe what was completed and where evidence can be found..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-400 resize-none shadow-sm"
                            />
                          </div>
                          {proofError && <div className="text-xs text-red-500">{proofError}</div>}
                          <div className="flex gap-3">
                            <Button variant="ghost" size="sm" onClick={() => { setShowProofForm(false); setSelectedMs(null); }}>Cancel</Button>
                            <Button size="sm" disabled={proofLoading || !proofUrl} onClick={async () => {
                              await submitProof(ms.id, proofUrl, proofDesc);
                              setShowProofForm(false);
                              setSelectedMs(null);
                              load();
                            }}>
                              {proofLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              Submit Proof On-Chain
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedMs(ms); setShowProofForm(true); setProofUrl(""); setProofDesc(""); }}>
                          <Upload className="w-3.5 h-3.5" /> Submit Proof
                        </Button>
                      )}
                    </>
                  )}

                  {ms.status === "PROOF_SUBMITTED" && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">
                        Proof submitted. An authorized verifier can trigger AI verification.
                      </div>
                      {verifyError && <div className="text-xs text-red-500">{verifyError}</div>}
                      {verifyTxHash && <div className="text-xs text-gray-400 font-mono">Tx: {verifyTxHash.slice(0, 20)}...</div>}
                      <Button size="sm" disabled={!connected || verifyLoading} onClick={async () => {
                        await verify(ms.id);
                        load();
                      }}>
                        {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        Trigger AI Verification
                      </Button>
                    </div>
                  )}

                  {ms.status === "VERIFIED" && connected && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Verified. Grant sponsor can release payout via{" "}
                      <a href={STUDIONET_CHAIN.explorer} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GenLayer Explorer</a>.
                    </div>
                  )}

                  {ms.status === "PAID" && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Payout of {parseInt(ms.amount).toLocaleString()} GEN released
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
