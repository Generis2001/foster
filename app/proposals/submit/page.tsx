"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/WalletContext";
import { useSubmitProposal } from "@/lib/hooks";
import { CONTRACTS, readContract, requireAddress, STUDIONET_CHAIN } from "@/lib/genlayer";
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
        const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
        const ids = (await readContract(gmAddr, "get_all_grant_ids", [])) as string[];
        const results = await Promise.all(
          ids.map(async (id) => {
            const json = await readContract(gmAddr, "get_grant", [id]);
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
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Proposal Submitted On-Chain!</h2>
          <p className="text-gray-500 mb-6">
            Your proposal is stored on GenLayer StudioNet and queued for AI validator evaluation
            via optimistic democracy consensus.
          </p>
          {submitTxHash && (
            <div className="card p-4 text-left mb-6">
              <div className="text-xs text-gray-400 mb-1.5">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-blue-600 break-all flex-1">{submitTxHash}</div>
                <a
                  href={`${STUDIONET_CHAIN.explorer}/tx/${submitTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-400 mb-6">
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
                      ? "bg-emerald-500 text-white"
                      : step === id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 border border-gray-200 text-gray-400"
                  }`}
                >
                  {step > id ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium ${step === id ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-16 mx-2 mb-4 transition-all ${step > id ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Select Grant Program</h2>
                <p className="text-sm text-gray-400">Choose which active grant you&apos;re applying for</p>
              </div>

              {grantsLoading && (
                <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading grants from chain...
                </div>
              )}

              {!grantsLoading && grants.length === 0 && (
                <div className="text-center py-10 text-gray-400">
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
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{g.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{g.description.slice(0, 80)}...</div>
                    <div className="flex gap-3 text-xs text-gray-400">
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">Project Details</h2>
                <p className="text-sm text-gray-400">Describe your project clearly and concisely</p>
              </div>
              {selectedGrant && (
                <div className="text-xs text-gray-500 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  Applying to: <span className="text-gray-700 font-medium">{selectedGrant.name}</span> · Max {parseInt(selectedGrant.max_grant_size).toLocaleString()} GEN
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">Team Information</h2>
                <p className="text-sm text-gray-400">Help validators assess your team&apos;s capability</p>
              </div>
              <Textarea
                label="Team Members & Background"
                placeholder="Describe your team members, roles, relevant experience, and past projects. Include GitHub profiles or links to previous work..."
                value={form.teamInfo}
                onChange={(e) => u("teamInfo", e.target.value)}
                rows={8}
                required
              />
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs font-medium text-blue-600 mb-1.5">How AI Validators Assess Teams</div>
                <p className="text-xs text-blue-500">
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">Roadmap & Milestones</h2>
                <p className="text-sm text-gray-400">Define your delivery plan with measurable outcomes</p>
              </div>
              <Textarea
                label="Project Roadmap"
                placeholder={"Month 1: Core implementation\nMonth 2: Testing and security audit\nMonth 3: Documentation and mainnet launch"}
                value={form.roadmap}
                onChange={(e) => u("roadmap", e.target.value)}
                rows={8}
                required
              />
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                <div className="text-xs font-medium text-violet-600 mb-1.5">Milestone-Based Funding</div>
                <p className="text-xs text-violet-500">
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit On-Chain</h2>
                <p className="text-sm text-gray-400">Your proposal will be stored on GenLayer StudioNet</p>
              </div>

              {!connected && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <div className="text-sm text-gray-700">Connect your wallet to submit</div>
                  </div>
                  <Button size="sm" onClick={connect} disabled={connecting}>
                    {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                  </Button>
                </div>
              )}

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {[
                  { label: "Grant", value: grants.find((g) => g.id === form.grantId)?.name || form.grantId || "—" },
                  { label: "Project Title", value: form.title || "—" },
                  { label: "Requested Amount", value: form.requestedAmount ? `${parseFloat(form.requestedAmount).toLocaleString()} GEN` : "—" },
                  { label: "Abstract", value: form.abstract || "—" },
                  { label: "Team", value: form.teamInfo ? `${form.teamInfo.slice(0, 80)}...` : "—" },
                  { label: "Roadmap", value: form.roadmap ? `${form.roadmap.slice(0, 80)}...` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 px-4 py-3">
                    <div className="text-sm text-gray-400 w-36 flex-shrink-0">{label}</div>
                    <div className="text-sm text-gray-900">{value}</div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-xs font-medium text-amber-600 mb-1.5">On-Chain Transaction</div>
                <p className="text-xs text-amber-500">
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
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fc]" />}>
      <SubmitProposalContent />
    </Suspense>
  );
}
