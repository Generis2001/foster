"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { useSubmitProposal } from "@/lib/hooks";
import { CONTRACTS, readContract, STUDIONET_CHAIN } from "@/lib/genlayer";
import { Grant } from "@/lib/types";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  Users,
  Map,
  Star,
  Send,
  Loader2,
  Wallet,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Grant", icon: FileText },
  { id: 2, label: "Project", icon: Star },
  { id: 3, label: "Team", icon: Users },
  { id: 4, label: "Roadmap", icon: Map },
  { id: 5, label: "Submit", icon: Send },
];

interface FormData {
  grantId: string;
  title: string;
  abstract: string;
  fullDescription: string;
  requestedAmount: string;
  githubUrl: string;
  websiteUrl: string;
  teamInfo: string;
  roadmap: string;
  impactStatement: string;
}

function SubmitProposalContent() {
  const params = useSearchParams();
  const preselectedGrant = params.get("grant") || "";

  const { connected, connect, connecting } = useWallet();
  const { submit, loading, error, txHash: submitTxHash } = useSubmitProposal();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    grantId: preselectedGrant,
    title: "",
    abstract: "",
    fullDescription: "",
    requestedAmount: "",
    githubUrl: "",
    websiteUrl: "",
    teamInfo: "",
    roadmap: "",
    impactStatement: "",
  });

  useEffect(() => {
    async function loadGrants() {
      if (!CONTRACTS.grantManager) return;
      setGrantsLoading(true);
      try {
        const ids = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
        const results = await Promise.all(
          ids.map(async (id) => {
            const json = await readContract(CONTRACTS.grantManager, "get_grant", [id]);
            return JSON.parse(json as string) as Grant;
          })
        );
        setGrants(results.filter((g) => g.status === "ACTIVE"));
      } catch {
        // ignore
      } finally {
        setGrantsLoading(false);
      }
    }
    loadGrants();
  }, []);

  function u(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!connected) {
      await connect();
      return;
    }
    try {
      await submit({
        grantId: form.grantId,
        title: form.title,
        abstract: form.abstract,
        fullDescription: form.fullDescription,
        requestedAmount: BigInt(Math.round(parseFloat(form.requestedAmount) * 1e18)),
        teamInfo: form.teamInfo,
        roadmap: form.roadmap,
        impactStatement: form.impactStatement,
        githubUrl: form.githubUrl,
        websiteUrl: form.websiteUrl,
      });
      setSubmitted(true);
    } catch {
      // error shown via hook
    }
  }

  if (submitted) {
    return (
      <AppLayout title="Submit Proposal">
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Proposal Submitted On-Chain!</h2>
          <p className="text-white/50 mb-6">
            Your proposal is stored on GenLayer StudioNet and queued for AI validator evaluation
            via optimistic democracy consensus.
          </p>
          {submitTxHash && (
            <div className="glass rounded-xl p-4 text-left mb-6">
              <div className="text-xs text-white/40 mb-1">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-blue-400 break-all flex-1">{submitTxHash}</div>
                <a
                  href={`${STUDIONET_CHAIN.explorer}/tx/${submitTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          <p className="text-sm text-white/40 mb-6">
            Evaluation typically takes 24–48 hours depending on validator consensus rounds.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/grants"><Button variant="secondary">Browse More Grants</Button></Link>
            <Link href="/dashboard"><Button>View Dashboard</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedGrant = grants.find((g) => g.id === form.grantId);

  return (
    <AppLayout title="Submit Proposal">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 px-4">
          {STEPS.map(({ id, label, icon: Icon }, i) => (
            <div key={id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    step > id
                      ? "bg-green-500 text-white"
                      : step === id
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                      : "bg-white/5 border border-white/10 text-white/30"
                  }`}
                >
                  {step > id ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs ${step === id ? "text-white" : "text-white/30"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-16 mx-2 mb-4 transition-all ${step > id ? "bg-green-500/50" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Select Grant Program</h2>
                <p className="text-sm text-white/40">Choose which active grant you&apos;re applying for</p>
              </div>

              {grantsLoading && (
                <div className="flex items-center justify-center py-10 gap-2 text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading grants from chain...
                </div>
              )}

              {!grantsLoading && grants.length === 0 && (
                <div className="text-center py-10 text-white/40">
                  <div className="mb-2">No active grant programs found on-chain.</div>
                  <Link href="/grants/create">
                    <Button size="sm" variant="secondary">Create a Grant Program</Button>
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                {grants.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => u("grantId", g.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      form.grantId === g.id
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium text-white mb-1">{g.name}</div>
                    <div className="text-xs text-white/40 mb-2">{g.description.slice(0, 80)}...</div>
                    <div className="flex gap-3 text-xs text-white/30">
                      <span>Max: {parseInt(g.max_grant_size).toLocaleString()} GEN</span>
                      <span>·</span>
                      <span>{parseInt(g.remaining_budget).toLocaleString()} GEN remaining</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Project Details</h2>
                <p className="text-sm text-white/40">Describe your project clearly and concisely</p>
              </div>
              {selectedGrant && (
                <div className="text-xs text-white/40 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  Applying to: <span className="text-white/70">{selectedGrant.name}</span> · Max {parseInt(selectedGrant.max_grant_size).toLocaleString()} GEN
                </div>
              )}
              <Input label="Project Title" placeholder="Decentralized AI Oracle Network" value={form.title} onChange={(e) => u("title", e.target.value)} required />
              <Textarea label="Abstract" placeholder="2-3 sentence summary of your project..." value={form.abstract} onChange={(e) => u("abstract", e.target.value)} rows={3} required />
              <Textarea label="Full Description" placeholder="Detailed description of your project, problem you're solving, and proposed solution..." value={form.fullDescription} onChange={(e) => u("fullDescription", e.target.value)} rows={6} required />
              <Input
                label="Requested Amount (GEN)"
                type="number"
                placeholder="10000"
                value={form.requestedAmount}
                onChange={(e) => u("requestedAmount", e.target.value)}
                hint={selectedGrant ? `Max: ${parseInt(selectedGrant.max_grant_size).toLocaleString()} GEN` : ""}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="GitHub URL (optional)" placeholder="https://github.com/..." value={form.githubUrl} onChange={(e) => u("githubUrl", e.target.value)} />
                <Input label="Website (optional)" placeholder="https://..." value={form.websiteUrl} onChange={(e) => u("websiteUrl", e.target.value)} />
              </div>
              <Textarea label="Impact Statement" placeholder="How will this project benefit the GenLayer ecosystem?" value={form.impactStatement} onChange={(e) => u("impactStatement", e.target.value)} rows={3} required />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Team Information</h2>
                <p className="text-sm text-white/40">Help validators assess your team&apos;s capability</p>
              </div>
              <Textarea
                label="Team Members & Background"
                placeholder="Describe your team members, roles, relevant experience, and past projects. Include GitHub profiles or links to previous work..."
                value={form.teamInfo}
                onChange={(e) => u("teamInfo", e.target.value)}
                rows={8}
                required
              />
              <div className="glass rounded-lg p-4 border border-blue-500/20">
                <div className="text-xs font-medium text-blue-400 mb-2">How AI Validators Assess Teams</div>
                <p className="text-xs text-white/50">
                  GenLayer validators evaluate your team based on prior experience building on-chain,
                  track record of shipping, and depth of expertise in your technical domain. Be specific
                  and link to verifiable work.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Roadmap & Milestones</h2>
                <p className="text-sm text-white/40">Define your delivery plan with measurable outcomes</p>
              </div>
              <Textarea
                label="Project Roadmap"
                placeholder={"Month 1: Core implementation\nMonth 2: Testing and security audit\nMonth 3: Documentation and mainnet launch"}
                value={form.roadmap}
                onChange={(e) => u("roadmap", e.target.value)}
                rows={8}
                required
              />
              <div className="glass rounded-lg p-4 border border-purple-500/20">
                <div className="text-xs font-medium text-purple-400 mb-2">Milestone-Based Funding</div>
                <p className="text-xs text-white/50">
                  After approval, you&apos;ll define on-chain milestones with specific success criteria.
                  GenLayer&apos;s AI validators fetch your GitHub releases, live demos, and reports to verify
                  completions. Funding is released per verified milestone — no rug pulls, no delays.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Review & Submit On-Chain</h2>
                <p className="text-sm text-white/40">Your proposal will be stored on GenLayer StudioNet</p>
              </div>

              {!connected && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <div className="text-sm text-white/70">Connect your wallet to submit</div>
                  </div>
                  <Button size="sm" onClick={connect} disabled={connecting}>
                    {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { label: "Grant", value: grants.find((g) => g.id === form.grantId)?.name || form.grantId || "—" },
                  { label: "Project Title", value: form.title || "—" },
                  { label: "Requested Amount", value: form.requestedAmount ? `${parseFloat(form.requestedAmount).toLocaleString()} GEN` : "—" },
                  { label: "Abstract", value: form.abstract || "—" },
                  { label: "Team", value: form.teamInfo ? `${form.teamInfo.slice(0, 80)}...` : "—" },
                  { label: "Roadmap", value: form.roadmap ? `${form.roadmap.slice(0, 80)}...` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4">
                    <div className="text-sm text-white/40 w-36 flex-shrink-0">{label}</div>
                    <div className="text-sm text-white">{value}</div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="glass rounded-lg p-4 border border-amber-500/20">
                <div className="text-xs font-medium text-amber-400 mb-2">On-Chain Transaction</div>
                <p className="text-xs text-white/50">
                  Submitting sends a transaction to GenLayer StudioNet (Chain ID: 61999).
                  Proposal data is stored on-chain and immediately queued for AI validator evaluation
                  via GenLayer&apos;s optimistic democracy consensus mechanism.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.grantId}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !form.title || !form.grantId}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting On-Chain...</>
                ) : !connected ? (
                  <><Wallet className="w-4 h-4" /> Connect to Submit</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Proposal</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SubmitProposalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508]" />}>
      <SubmitProposalContent />
    </Suspense>
  );
}
