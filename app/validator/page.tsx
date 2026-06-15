"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { CONTRACTS, readContract, requireAddress } from "@/lib/genlayer";
import { useEvaluateProposal, useSubmitValidatorEvaluation } from "@/lib/hooks";
import { Proposal, Evaluation } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  Brain, Loader2, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Wallet, Zap, ChevronRight,
} from "lucide-react";

export default function ValidatorPage() {
  const { connected, connect, connecting, address } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState("85");
  const [manualRec, setManualRec] = useState("APPROVE");
  const [manualReasoning, setManualReasoning] = useState("");

  const { evaluate, loading: aiLoading, error: aiError, txHash: aiTxHash } = useEvaluateProposal();
  const { submit: submitManual, loading: manLoading, error: manError } = useSubmitValidatorEvaluation();

  useEffect(() => {
    async function load() {
      if (!CONTRACTS.proposalManager) {
        setLoading(false);
        return;
      }
      try {
        const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
        const count = (await readContract(pmAddr, "get_proposal_count", [])) as bigint;
        const ids = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);
        const results = await Promise.all(
          ids.map(async (id) => {
            const json = await readContract(pmAddr, "get_proposal", [id]);
            if (!json || json === "") return null;
            return JSON.parse(json as string) as Proposal;
          })
        );
        const valid = results.filter(Boolean) as Proposal[];
        setProposals(valid);

        if (CONTRACTS.evaluationEngine) {
          const eeAddr = requireAddress(CONTRACTS.evaluationEngine, "EvaluationEngine");
          const evalResults = await Promise.all(
            valid.map(async (p) => {
              try {
                const json = await readContract(eeAddr, "get_evaluation_for_proposal", [p.id]);
                if (json && json !== "") return { id: p.id, eval: JSON.parse(json as string) as Evaluation };
              } catch { /**/ }
              return null;
            })
          );
          const evalMap: Record<string, Evaluation> = {};
          evalResults.forEach((r) => { if (r) evalMap[r.id] = r.eval; });
          setEvaluations(evalMap);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingProposals = proposals.filter((p) => p.status === "PENDING" && !evaluations[p.id]);
  const evaluatedProposals = proposals.filter((p) => evaluations[p.id]);
  const selectedProposal = proposals.find((p) => p.id === selected);
  const selectedEval = selected ? evaluations[selected] : null;

  async function triggerAIEvaluation(proposal: Proposal) {
    if (!CONTRACTS.evaluationEngine) return;
    let grantCriteria = "General merit, technical quality, team experience, and ecosystem impact.";
    if (CONTRACTS.grantManager) {
      try {
        const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
        const grantJson = await readContract(gmAddr, "get_grant", [proposal.grant_id]);
        if (grantJson && grantJson !== "") {
          const grant = JSON.parse(grantJson as string);
          grantCriteria = `Focus areas: ${grant.focus_areas}. Eligibility: ${grant.eligibility}. Max grant: ${grant.max_grant_size} GEN.`;
        }
      } catch { /**/ }
    }
    await evaluate({
      proposalId: proposal.id,
      proposalJson: JSON.stringify(proposal),
      grantCriteria,
    });
  }

  return (
    <AppLayout title="Validator Hub">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Validator Hub</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Trigger AI evaluation rounds and participate in consensus
            </p>
          </div>
          {!connected && (
            <Button size="sm" onClick={connect} disabled={connecting}>
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              Connect Wallet
            </Button>
          )}
          {connected && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {address?.slice(0, 10)}...{address?.slice(-4)}
            </div>
          )}
        </div>

        {!CONTRACTS.evaluationEngine && (
          <div className="flex items-center gap-3 p-4 card border-l-4 border-l-amber-400 text-sm text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            EvaluationEngine contract not configured. Set NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS in .env.local
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading proposals from chain...
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-3 gap-5">
            {/* Proposal list */}
            <div className="col-span-1 space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Pending Evaluation ({pendingProposals.length})
                </div>
                <div className="space-y-2">
                  {pendingProposals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selected === p.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 truncate mb-1">{p.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{parseInt(p.requested_amount).toLocaleString()} GEN</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </button>
                  ))}
                  {pendingProposals.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                      No pending proposals
                    </div>
                  )}
                </div>
              </div>

              {evaluatedProposals.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Evaluated ({evaluatedProposals.length})
                  </div>
                  <div className="space-y-2">
                    {evaluatedProposals.map((p) => {
                      const ev = evaluations[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selected === p.id
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 truncate mb-1">{p.title}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">{ev?.result?.score}/100</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              ev?.result?.recommendation === "APPROVE" ? "badge-green" :
                              ev?.result?.recommendation === "REJECT" ? "badge-red" :
                              "badge-purple"
                            }`}>{ev?.result?.recommendation}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="col-span-2">
              {!selectedProposal && (
                <div className="card p-10 text-center text-gray-400">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-6 h-6 text-gray-400" />
                  </div>
                  Select a proposal to evaluate
                </div>
              )}

              {selectedProposal && (
                <div className="card p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg mb-1">{selectedProposal.title}</h2>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={selectedProposal.status} size="sm" />
                        <span className="text-xs text-gray-400">{parseInt(selectedProposal.requested_amount).toLocaleString()} GEN</span>
                      </div>
                    </div>
                    <Link href={`/proposals/${selectedProposal.id}`}>
                      <Button variant="ghost" size="sm">View Full Proposal</Button>
                    </Link>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">{selectedProposal.abstract}</p>

                  {/* AI Evaluation Panel */}
                  {!selectedEval ? (
                    <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-violet-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Trigger AI Evaluation</h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        This will call the EvaluationEngine contract on GenLayer StudioNet,
                        triggering the leader validator to run LLM inference and other validators
                        to independently verify via optimistic democracy.
                      </p>
                      {aiError && (
                        <div className="flex items-center gap-2 text-red-500 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> {aiError}
                        </div>
                      )}
                      {aiTxHash && (
                        <div className="text-xs text-gray-400">
                          Tx: <span className="font-mono text-blue-600">{aiTxHash.slice(0, 20)}...</span>
                          <span className="ml-1 text-gray-400">(consensus in progress...)</span>
                        </div>
                      )}
                      <Button
                        onClick={() => triggerAIEvaluation(selectedProposal)}
                        disabled={!connected || aiLoading}
                      >
                        {aiLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Running Consensus...</>
                        ) : (
                          <><Zap className="w-4 h-4" /> Trigger AI Evaluation</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        {selectedEval.result.recommendation === "APPROVE" ? (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        ) : selectedEval.result.recommendation === "REJECT" ? (
                          <XCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <RefreshCw className="w-6 h-6 text-violet-500" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{selectedEval.result.recommendation}</div>
                          <div className="text-xs text-gray-400">AI Consensus Score: {selectedEval.result.score}/100</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 italic">&ldquo;{selectedEval.result.reasoning}&rdquo;</p>
                    </div>
                  )}

                  {/* Manual Validator Evaluation */}
                  {selectedEval && (
                    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                      <h3 className="font-medium text-gray-900 text-sm">Submit Validator Assessment</h3>
                      <p className="text-xs text-gray-400">Add your independent evaluation to the consensus record.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1.5 font-medium">Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={manualScore}
                            onChange={(e) => setManualScore(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1.5 font-medium">Recommendation</label>
                          <select
                            value={manualRec}
                            onChange={(e) => setManualRec(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
                          >
                            <option>APPROVE</option>
                            <option>REJECT</option>
                            <option>REVISION</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        value={manualReasoning}
                        onChange={(e) => setManualReasoning(e.target.value)}
                        placeholder="Your reasoning and assessment..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none shadow-sm"
                      />
                      {manError && <div className="text-xs text-red-500">{manError}</div>}
                      <Button
                        size="sm"
                        disabled={!connected || manLoading || !manualReasoning.trim()}
                        onClick={() => submitManual({
                          proposalId: selectedProposal.id,
                          score: parseInt(manualScore),
                          recommendation: manualRec,
                          reasoning: manualReasoning,
                        })}
                      >
                        {manLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Submit On-Chain
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
