# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class EvaluationEngine(gl.Contract):
    evaluations: TreeMap[str, str]
    proposal_evaluations: TreeMap[str, str]
    eval_count: u256

    def __init__(self):
        self.eval_count = u256(0)

    @gl.public.view
    def get_evaluation(self, eval_id: str) -> str:
        return self.evaluations.get(eval_id, "")

    @gl.public.view
    def get_evaluation_for_proposal(self, proposal_id: str) -> str:
        eval_id = self.proposal_evaluations.get(proposal_id, "")
        if eval_id == "":
            return ""
        return self.evaluations.get(eval_id, "")

    @gl.public.write
    def evaluate_proposal(
        self,
        proposal_id: str,
        proposal_json: str,
        grant_criteria: str,
    ) -> str:
        eval_id = f"eval_{self.eval_count}"

        def leader_fn():
            prompt = f"""You are an expert grant evaluator for a blockchain and AI innovation fund.

Evaluate the following grant proposal against the provided criteria. Be thorough, fair, and objective.

GRANT CRITERIA:
{grant_criteria}

PROPOSAL DATA:
{proposal_json}

Provide your evaluation as a JSON object with exactly these fields:
- "score": integer 0-100 (overall merit score)
- "recommendation": one of "APPROVE", "REJECT", or "REVISION"
- "technical_score": integer 0-100
- "impact_score": integer 0-100
- "team_score": integer 0-100
- "feasibility_score": integer 0-100
- "reasoning": string explaining your decision (2-3 sentences)
- "strengths": list of 2-3 key strengths
- "concerns": list of 0-3 concerns or areas for improvement
- "suggested_funding": integer (recommended funding amount in GEN, may differ from requested)

Return ONLY valid JSON, no markdown or explanation."""
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False

            leader_data = leader_result.calldata

            my_prompt = f"""You are an expert grant evaluator for a blockchain and AI innovation fund.

Evaluate the following grant proposal against the provided criteria. Be thorough, fair, and objective.

GRANT CRITERIA:
{grant_criteria}

PROPOSAL DATA:
{proposal_json}

Provide your evaluation as a JSON object with exactly these fields:
- "score": integer 0-100 (overall merit score)
- "recommendation": one of "APPROVE", "REJECT", or "REVISION"
- "technical_score": integer 0-100
- "impact_score": integer 0-100
- "team_score": integer 0-100
- "feasibility_score": integer 0-100
- "reasoning": string explaining your decision (2-3 sentences)
- "strengths": list of 2-3 key strengths
- "concerns": list of 0-3 concerns or areas for improvement
- "suggested_funding": integer (recommended funding amount in GEN, may differ from requested)

Return ONLY valid JSON, no markdown or explanation."""

            my_result = gl.nondet.exec_prompt(my_prompt, response_format="json")

            # Consensus: same recommendation and scores within 15 points
            same_recommendation = my_result.get("recommendation") == leader_data.get("recommendation")
            score_close = abs(my_result.get("score", 0) - leader_data.get("score", 0)) <= 15

            return same_recommendation and score_close

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        eval_data = {
            "id": eval_id,
            "proposal_id": proposal_id,
            "result": result,
            "evaluator": gl.message.sender_account,
            "status": "COMPLETE",
        }

        self.evaluations[eval_id] = json.dumps(eval_data)
        self.proposal_evaluations[proposal_id] = eval_id
        self.eval_count = u256(int(self.eval_count) + 1)

        return eval_id

    @gl.public.write
    def submit_validator_evaluation(
        self,
        proposal_id: str,
        score: u32,
        recommendation: str,
        reasoning: str,
    ) -> None:
        """Manual validator evaluation (used alongside AI evaluation for hybrid consensus)."""
        eval_json = self.get_evaluation_for_proposal(proposal_id)
        assert eval_json != "", "No AI evaluation exists yet"

        eval_data = json.loads(eval_json)
        validator_evals = eval_data.get("validator_evaluations", [])

        validator_eval = {
            "validator": gl.message.sender_account,
            "score": int(score),
            "recommendation": recommendation,
            "reasoning": reasoning,
        }
        validator_evals.append(validator_eval)
        eval_data["validator_evaluations"] = validator_evals

        eval_id = self.proposal_evaluations.get(proposal_id, "")
        self.evaluations[eval_id] = json.dumps(eval_data)
