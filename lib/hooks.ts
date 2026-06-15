"use client";
import { useState, useCallback } from "react";
import { CONTRACTS, readContract, writeContract, waitForTx, requireAddress } from "@/lib/genlayer";
import { Grant, Proposal, Evaluation, Milestone } from "@/lib/types";

// ─── Grant Manager ───────────────────────────────────────────────────────────

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrants = useCallback(async () => {
    if (!CONTRACTS.grantManager) return;
    setLoading(true);
    setError(null);
    const addr = requireAddress(CONTRACTS.grantManager, "GrantManager");
    try {
      const count = (await readContract(addr, "get_grant_count", [])) as bigint;
      const ids = Array.from({ length: Number(count) }, (_, i) => `grant_${i}`);
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(addr, "get_grant", [id]);
          if (!json || json === "") return null;
          return JSON.parse(json as string) as Grant;
        })
      );
      setGrants(results.filter(Boolean) as Grant[]);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { grants, loading, error, fetchGrants };
}

export function useGrantBalance(grantId: string) {
  const [balance, setBalance] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!CONTRACTS.grantManager || !grantId) return;
    const bal = await readContract(requireAddress(CONTRACTS.grantManager, "GrantManager"), "get_grant_balance", [grantId]);
    setBalance((bal as bigint).toString());
  }, [grantId]);

  return { balance, fetch };
}

export function useCreateGrant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const createGrant = useCallback(async (params: {
    name: string;
    description: string;
    totalBudget: bigint;
    focusAreas: string;
    maxGrantSize: bigint;
    deadline: bigint;
    eligibility: string;
    depositGEN: bigint;
  }) => {
    if (!CONTRACTS.grantManager) throw new Error("GrantManager contract address not configured.");
    setLoading(true);
    setError(null);
    const gmAddr = requireAddress(CONTRACTS.grantManager, "GrantManager");
    try {
      const hash = await writeContract(
        gmAddr,
        "create_grant_program",
        [
          params.name,
          params.description,
          params.totalBudget,
          params.focusAreas,
          params.maxGrantSize,
          params.deadline,
          params.eligibility,
        ],
        params.depositGEN
      );
      setTxHash(hash);
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createGrant, loading, error, txHash };
}

// ─── Proposal Manager ────────────────────────────────────────────────────────

export function useProposals(grantId?: string) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!CONTRACTS.proposalManager) return;
    setLoading(true);
    setError(null);
    const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
    try {
      let ids: string[];
      if (grantId) {
        ids = (await readContract(pmAddr, "get_proposals_for_grant", [grantId])) as string[];
      } else {
        const count = (await readContract(pmAddr, "get_proposal_count", [])) as bigint;
        ids = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(pmAddr, "get_proposal", [id]);
          if (!json || json === "") return null;
          return JSON.parse(json as string) as Proposal;
        })
      );
      setProposals(results.filter(Boolean) as Proposal[]);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [grantId]);

  return { proposals, loading, error, fetchProposals };
}

export function useProposal(proposalId: string) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!CONTRACTS.proposalManager || !proposalId) return;
    setLoading(true);
    try {
      const json = await readContract(requireAddress(CONTRACTS.proposalManager, "ProposalManager"), "get_proposal", [proposalId]);
      if (json && json !== "") setProposal(JSON.parse(json as string) as Proposal);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  return { proposal, loading, fetch };
}

export function useSubmitProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submit = useCallback(async (params: {
    grantId: string;
    title: string;
    abstract: string;
    fullDescription: string;
    requestedAmount: bigint;
    teamInfo: string;
    roadmap: string;
    impactStatement: string;
    githubUrl: string;
    websiteUrl: string;
  }) => {
    if (!CONTRACTS.proposalManager) throw new Error("ProposalManager contract address not configured.");
    setLoading(true);
    setError(null);
    const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
    try {
      const hash = await writeContract(
        pmAddr,
        "submit_proposal",
        [
          params.grantId,
          params.title,
          params.abstract,
          params.fullDescription,
          params.requestedAmount,
          params.teamInfo,
          params.roadmap,
          params.impactStatement,
          params.githubUrl,
          params.websiteUrl,
        ]
      );
      setTxHash(hash);
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, txHash };
}

export function useUpdateProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (params: {
    proposalId: string;
    title: string;
    abstract: string;
    fullDescription: string;
    requestedAmount: bigint;
    roadmap: string;
    impactStatement: string;
  }) => {
    if (!CONTRACTS.proposalManager) throw new Error("ProposalManager contract address not configured.");
    setLoading(true);
    setError(null);
    const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
    try {
      const hash = await writeContract(
        pmAddr,
        "update_proposal",
        [
          params.proposalId,
          params.title,
          params.abstract,
          params.fullDescription,
          params.requestedAmount,
          params.roadmap,
          params.impactStatement,
        ]
      );
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useRequestAppeal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appeal = useCallback(async (proposalId: string, reason: string) => {
    if (!CONTRACTS.proposalManager) throw new Error("ProposalManager contract address not configured.");
    setLoading(true);
    setError(null);
    const pmAddr = requireAddress(CONTRACTS.proposalManager, "ProposalManager");
    try {
      const hash = await writeContract(
        pmAddr,
        "request_appeal",
        [proposalId, reason]
      );
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { appeal, loading, error };
}

// ─── Evaluation Engine ───────────────────────────────────────────────────────

export function useEvaluation(proposalId: string) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!CONTRACTS.evaluationEngine || !proposalId) return;
    setLoading(true);
    try {
      const json = await readContract(
        requireAddress(CONTRACTS.evaluationEngine, "EvaluationEngine"),
        "get_evaluation_for_proposal",
        [proposalId]
      );
      if (json && json !== "") setEvaluation(JSON.parse(json as string) as Evaluation);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  return { evaluation, loading, fetch };
}

export function useEvaluateProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const evaluate = useCallback(async (params: {
    proposalId: string;
    proposalJson: string;
    grantCriteria: string;
  }) => {
    if (!CONTRACTS.evaluationEngine) throw new Error("EvaluationEngine contract address not configured.");
    setLoading(true);
    setError(null);
    const eeAddr = requireAddress(CONTRACTS.evaluationEngine, "EvaluationEngine");
    try {
      const hash = await writeContract(
        eeAddr,
        "evaluate_proposal",
        [params.proposalId, params.proposalJson, params.grantCriteria]
      );
      setTxHash(hash);
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { evaluate, loading, error, txHash };
}

export function useSubmitValidatorEvaluation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (params: {
    proposalId: string;
    score: number;
    recommendation: string;
    reasoning: string;
  }) => {
    if (!CONTRACTS.evaluationEngine) throw new Error("EvaluationEngine contract address not configured.");
    setLoading(true);
    setError(null);
    const eeAddr = requireAddress(CONTRACTS.evaluationEngine, "EvaluationEngine");
    try {
      const hash = await writeContract(
        eeAddr,
        "submit_validator_evaluation",
        [params.proposalId, params.score, params.recommendation, params.reasoning]
      );
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

// ─── Milestone Manager ───────────────────────────────────────────────────────

export function useMilestones(proposalId: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!CONTRACTS.milestoneManager || !proposalId) return;
    setLoading(true);
    const mmAddr = requireAddress(CONTRACTS.milestoneManager, "MilestoneManager");
    try {
      let ids: string[] = [];
      try {
        ids = (await readContract(
          mmAddr,
          "get_milestones_for_proposal",
          [proposalId]
        )) as string[];
      } catch {
        ids = [];
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(mmAddr, "get_milestone", [id]);
          if (!json || json === "") return null;
          return JSON.parse(json as string) as Milestone;
        })
      );
      setMilestones(results.filter(Boolean) as Milestone[]);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  return { milestones, loading, fetch };
}

export function useSubmitMilestoneProof() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (milestoneId: string, proofUrl: string, proofDescription: string) => {
    if (!CONTRACTS.milestoneManager) throw new Error("MilestoneManager contract address not configured.");
    setLoading(true);
    setError(null);
    const mmAddr = requireAddress(CONTRACTS.milestoneManager, "MilestoneManager");
    try {
      const hash = await writeContract(
        mmAddr,
        "submit_milestone_proof",
        [milestoneId, proofUrl, proofDescription]
      );
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

export function useVerifyMilestone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const verify = useCallback(async (milestoneId: string) => {
    if (!CONTRACTS.milestoneManager) throw new Error("MilestoneManager contract address not configured.");
    setLoading(true);
    setError(null);
    const mmAddr = requireAddress(CONTRACTS.milestoneManager, "MilestoneManager");
    try {
      const hash = await writeContract(
        mmAddr,
        "verify_milestone",
        [milestoneId]
      );
      setTxHash(hash);
      await waitForTx(hash);
      return hash;
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { verify, loading, error, txHash };
}
