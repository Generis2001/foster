export type ProposalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED"
  | "APPEALED"
  | "FUNDED"
  | "COMPLETED";

export type GrantStatus = "ACTIVE" | "PAUSED" | "CLOSED" | "COMPLETED";

export type MilestoneStatus =
  | "PENDING"
  | "PROOF_SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "PAID";

export interface Grant {
  id: string;
  name: string;
  description: string;
  total_budget: string;
  remaining_budget: string;
  focus_areas: string;
  max_grant_size: string;
  deadline: string;
  eligibility: string;
  sponsor: string;
  status: GrantStatus;
  proposal_count: number;
  funded_count: number;
}

export interface Proposal {
  id: string;
  grant_id: string;
  title: string;
  abstract: string;
  full_description: string;
  requested_amount: string;
  team_info: string;
  roadmap: string;
  impact_statement: string;
  github_url: string;
  website_url: string;
  proposer: string;
  status: ProposalStatus;
  submitted_at: string;
  evaluation_score: number | null;
  evaluation_recommendation: string | null;
  appeal_count: number;
}

export interface EvaluationResult {
  score: number;
  recommendation: "APPROVE" | "REJECT" | "REVISION";
  technical_score: number;
  impact_score: number;
  team_score: number;
  feasibility_score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  suggested_funding: number;
}

export interface Evaluation {
  id: string;
  proposal_id: string;
  result: EvaluationResult;
  evaluator: string;
  status: string;
  validator_evaluations?: ValidatorEvaluation[];
}

export interface ValidatorEvaluation {
  validator: string;
  score: number;
  recommendation: string;
  reasoning: string;
}

export interface Milestone {
  id: string;
  proposal_id: string;
  title: string;
  description: string;
  amount: string;
  due_date: string;
  success_criteria: string;
  status: MilestoneStatus;
  proof_url: string | null;
  proof_description: string | null;
  verification_result: {
    verified: boolean;
    confidence: number;
    reasoning: string;
    feedback: string;
  } | null;
  paid?: boolean;
}
