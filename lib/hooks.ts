"use client";
import { useState, useCallback } from "react";
import { CONTRACTS, readContract, writeContract, waitForTx } from "@/lib/genlayer";
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
    try {
      const ids = (await readContract(CONTRACTS.grantManager, "get_all_grant_ids", [])) as string[];
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(CONTRACTS.grantManager, "get_grant", [id]);
          return JSON.parse(json as string) as Grant;
        })
      );
      setGrants(results);
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
    const bal = await readContract(CONTRACTS.grantManager, "get_grant_balance", [grantId]);
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
    if (!CONTRACTS.grantManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.grantManager,
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
    try {
      let ids: string[];
      if (grantId) {
        ids = (await readContract(CONTRACTS.proposalManager, "get_proposals_for_grant", [grantId])) as string[];
      } else {
        // Fetch count and get all
        const count = (await readContract(CONTRACTS.proposalManager, "get_proposal_count", [])) as bigint;
        ids = Array.from({ length: Number(count) }, (_, i) => `prop_${i}`);
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(CONTRACTS.proposalManager, "get_proposal", [id]);
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
      const json = await readContract(CONTRACTS.proposalManager, "get_proposal", [proposalId]);
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
    if (!CONTRACTS.proposalManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.proposalManager,
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
    if (!CONTRACTS.proposalManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.proposalManager,
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
    if (!CONTRACTS.proposalManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.proposalManager,
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
        CONTRACTS.evaluationEngine,
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
    if (!CONTRACTS.evaluationEngine) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.evaluationEngine,
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
    if (!CONTRACTS.evaluationEngine) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.evaluationEngine,
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
    try {
      let ids: string[] = [];
      try {
        ids = (await readContract(
          CONTRACTS.milestoneManager,
          "get_milestones_for_proposal",
          [proposalId]
        )) as string[];
      } catch {
        // proposal has no milestones yet
        ids = [];
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          const json = await readContract(CONTRACTS.milestoneManager, "get_milestone", [id]);
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
    if (!CONTRACTS.milestoneManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.milestoneManager,
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
    if (!CONTRACTS.milestoneManager) throw new Error("Contract not deployed yet.");
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContract(
        CONTRACTS.milestoneManager,
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
