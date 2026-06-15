"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useProposal, useEvaluation, useMilestones, useRequestAppeal } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletContext";
import { STUDIONET_CHAIN } from "@/lib/genlayer";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, ExternalLink,
  Brain, CheckCircle, XCircle, RefreshCw, GitBranch,
  Globe, Coins, Clock, Star,
} from "lucide-react";
import { useState } from "react";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "from-green-500 to-emerald-400" : value >= 60 ? "from-blue-500 to-indigo-400" : "from-amber-500 to-orange-400";
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1.5">
        <span>{label}</span>
        <span className="font-mono text-white">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const { proposal, loading, fetch } = useProposal(id);
  const { evaluation, loading: evalLoading, fetch: fetchEval } = useEvaluation(id);
  const { milestones, loading: msLoading, fetch: fetchMs } = useMilestones(id);
  const { appeal, loading: appealing, error: appealError } = useRequestAppeal();
  const [appealReason, setAppealReason] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);

  useEffect(() => {
    fetch();
    fetchEval();
    fetchMs();
  }, [fetch, fetchEval, fetchMs]);

  const isProposer = proposal && address && proposal.proposer.toLowerCase() === address.toLowerCase();
  const canAppeal = proposal && ["REJECTED", "REVISION_REQUESTED"].includes(proposal.status) && isProposer;

  if (loading) {
    return (
      <AppLayout title="Proposal">
        <div className="flex items-center justify-center py-20 gap-3 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading proposal from chain...
        </div>
      </AppLayout>
    );
  }

  if (!proposal) {
    return (
      <AppLayout title="Proposal Not Found">
        <div className="text-center py-20 text-white/40">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
          Proposal not found on-chain.
        </div>
      </AppLayout>
    );
  }

  const evalResult = evaluation?.result;

  return (
    <AppLayout title={`Proposal: ${proposal.title}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/grants" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Grants
        </Link>

        {/* Header */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-2">{proposal.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={proposal.status} />
                <span className="text-xs text-white/40 font-mono">{proposal.id}</span>
                <span className="text-xs text-white/40">Grant: {proposal.grant_id}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{parseInt(proposal.requested_amount).toLocaleString()}</div>
              <div className="text-xs text-white/40">GEN requested</div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap text-xs text-white/40">
            <span className="font-mono">{proposal.proposer.slice(0, 10)}...{proposal.proposer.slice(-6)}</span>
            {proposal.github_url && (
              <a href={proposal.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white/70">
                <GitBranch className="w-3 h-3" /> GitHub
              </a>
            )}
            {proposal.website_url && (
              <a href={proposal.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white/70">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="glass rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Abstract</h3>
            <p className="text-sm text-white/80 leading-relaxed">{proposal.abstract}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Full Description</h3>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{proposal.full_description}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Team</h3>
              <p className="text-sm text-white/70 leading-relaxed">{proposal.team_info}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Impact</h3>
              <p className="text-sm text-white/70 leading-relaxed">{proposal.impact_statement}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Roadmap</h3>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{proposal.roadmap}</p>
          </div>
        </div>

        {/* AI Evaluation */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">AI Validator Evaluation</h2>
            {evalLoading && <Loader2 className="w-4 h-4 animate-spin text-white/40 ml-auto" />}
          </div>

          {!evalLoading && !evaluation && (
            <div className="text-sm text-white/40 text-center py-6">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Evaluation not yet triggered. A validator must initiate the AI consensus round.
              <div className="mt-3">
                <Link href="/validator">
                  <Button variant="secondary" size="sm">Go to Validator Hub</Button>
                </Link>
              </div>
            </div>
          )}

          {evaluation && evalResult && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {evalResult.recommendation === "APPROVE" ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : evalResult.recommendation === "REJECT" ? (
                    <XCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <RefreshCw className="w-6 h-6 text-purple-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">{evalResult.recommendation}</div>
                    <div className="text-xs text-white/40">Consensus decision</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{evalResult.score}</div>
                  <div className="text-xs text-white/40">/ 100 overall</div>
                </div>
              </div>

              <div className="space-y-3">
                <ScoreBar label="Technical" value={evalResult.technical_score} />
                <ScoreBar label="Impact" value={evalResult.impact_score} />
                <ScoreBar label="Team" value={evalResult.team_score} />
                <ScoreBar label="Feasibility" value={evalResult.feasibility_score} />
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/60 mb-2">Reasoning</div>
                <p className="text-sm text-white/70">{evalResult.reasoning}</p>
              </div>

              {evalResult.strengths?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Strengths
                  </div>
                  <ul className="space-y-1">
                    {evalResult.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">·</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evalResult.concerns?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-amber-400 mb-2">Concerns</div>
                  <ul className="space-y-1">
                    {evalResult.concerns.map((c, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">·</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evalResult.suggested_funding && (
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/60">Suggested funding:</span>
                  <span className="text-white font-medium">{evalResult.suggested_funding.toLocaleString()} GEN</span>
                </div>
              )}

              {/* Validator breakdown */}
              {evaluation.validator_evaluations && evaluation.validator_evaluations.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-white/60 mb-3">Validator Consensus ({evaluation.validator_evaluations.length} validators)</div>
                  <div className="space-y-2">
                    {evaluation.validator_evaluations.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">V{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/60 truncate">{v.reasoning}</div>
                        </div>
                        <div className="text-xs font-mono text-white/50">{v.score}/100</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          v.recommendation === "APPROVE" ? "bg-green-500/10 text-green-400" :
                          v.recommendation === "REJECT" ? "bg-red-500/10 text-red-400" :
                          "bg-purple-500/10 text-purple-400"
                        }`}>{v.recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold text-white mb-5">Milestones</h2>
            <div className="space-y-3">
              {milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white mb-0.5">{ms.title}</div>
                    <div className="text-xs text-white/40">{ms.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{parseInt(ms.amount).toLocaleString()} GEN</div>
                    <StatusBadge status={ms.status} type="milestone" size="sm" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/milestones">
                <Button variant="secondary" size="sm">Manage Milestones <ExternalLink className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
          </div>
        )}

        {/* Appeal section */}
        {canAppeal && (
          <div className="glass rounded-xl p-6 border border-purple-500/20">
            <h2 className="font-semibold text-white mb-2">Request Appeal</h2>
            <p className="text-sm text-white/50 mb-4">
              You can appeal this decision. A new evaluation round will be triggered with fresh validators.
            </p>
            {!showAppeal ? (
              <Button variant="secondary" size="sm" onClick={() => setShowAppeal(true)}>
                Request Appeal
              </Button>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you believe the evaluation was incorrect or unfair..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  rows={4}
                />
                {appealError && (
                  <div className="text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> {appealError}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowAppeal(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={appealing || !appealReason.trim()}
                    onClick={async () => {
                      await appeal(proposal.id, appealReason);
                      setShowAppeal(false);
                      fetch();
                    }}
                  >
                    {appealing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Submit Appeal On-Chain
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explorer link */}
        <div className="text-center">
          <a
            href={`${STUDIONET_CHAIN.explorer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on GenLayer Explorer
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
