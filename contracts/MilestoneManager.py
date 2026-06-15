# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class MilestoneManager(gl.Contract):
    milestones: TreeMap[str, str]
    proposal_milestones: TreeMap[str, DynArray[str]]
    milestone_count: u256

    def __init__(self):
        self.milestone_count = u256(0)

    @gl.public.view
    def get_milestone(self, milestone_id: str) -> str:
        return self.milestones.get(milestone_id, "")

    @gl.public.view
    def get_milestones_for_proposal(self, proposal_id: str) -> list[str]:
        result = []
        arr = self.proposal_milestones.get(proposal_id, DynArray[str]())
        for mid in arr:
            result.append(mid)
        return result

    @gl.public.write
    def create_milestone(
        self,
        proposal_id: str,
        title: str,
        description: str,
        amount: u256,
        due_date: u256,
        success_criteria: str,
    ) -> str:
        milestone_id = f"ms_{self.milestone_count}"

        milestone_data = {
            "id": milestone_id,
            "proposal_id": proposal_id,
            "title": title,
            "description": description,
            "amount": str(amount),
            "due_date": str(due_date),
            "success_criteria": success_criteria,
            "status": "PENDING",
            "proof_url": None,
            "proof_description": None,
            "verification_result": None,
        }

        self.milestones[milestone_id] = json.dumps(milestone_data)

        if proposal_id not in self.proposal_milestones:
            self.proposal_milestones[proposal_id] = DynArray[str]()
        self.proposal_milestones[proposal_id].append(milestone_id)

        self.milestone_count = u256(int(self.milestone_count) + 1)
        return milestone_id

    @gl.public.write
    def submit_milestone_proof(
        self,
        milestone_id: str,
        proof_url: str,
        proof_description: str,
    ) -> None:
        milestone_json = self.milestones.get(milestone_id, "")
        assert milestone_json != "", "Milestone not found"

        milestone_data = json.loads(milestone_json)
        assert milestone_data["status"] == "PENDING", "Milestone not pending"

        milestone_data["proof_url"] = proof_url
        milestone_data["proof_description"] = proof_description
        milestone_data["status"] = "PROOF_SUBMITTED"
        milestone_data["submitter"] = gl.message.sender_address

        self.milestones[milestone_id] = json.dumps(milestone_data)

    @gl.public.write
    def verify_milestone(self, milestone_id: str) -> None:
        milestone_json = self.milestones.get(milestone_id, "")
        assert milestone_json != "", "Milestone not found"

        milestone_data = json.loads(milestone_json)
        assert milestone_data["status"] == "PROOF_SUBMITTED", "No proof submitted"

        proof_url = milestone_data.get("proof_url", "")
        proof_description = milestone_data.get("proof_description", "")
        success_criteria = milestone_data.get("success_criteria", "")
        title = milestone_data.get("title", "")

        def leader_fn():
            # Fetch the proof URL for real-world verification
            proof_content = ""
            if proof_url.startswith("http"):
                try:
                    proof_content = gl.nondet.web.get(proof_url)[:2000]
                except Exception:
                    proof_content = "Unable to fetch URL content"

            prompt = f"""You are a milestone verifier for a blockchain grant program.

MILESTONE: {title}
SUCCESS CRITERIA: {success_criteria}
PROOF DESCRIPTION: {proof_description}
PROOF URL CONTENT: {proof_content}

Has this milestone been successfully completed based on the evidence provided?

Return JSON with:
- "verified": boolean (true if milestone is complete)
- "confidence": integer 0-100 (confidence in your assessment)
- "reasoning": string (2-3 sentence explanation)
- "feedback": string (constructive feedback for the team)

Return ONLY valid JSON."""
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False

            leader_data = leader_result.calldata

            my_prompt = f"""You are a milestone verifier for a blockchain grant program.

MILESTONE: {title}
SUCCESS CRITERIA: {success_criteria}
PROOF DESCRIPTION: {proof_description}

Has this milestone been successfully completed based on the evidence provided?

Return JSON with:
- "verified": boolean
- "confidence": integer 0-100
- "reasoning": string
- "feedback": string

Return ONLY valid JSON."""
            my_result = gl.nondet.exec_prompt(my_prompt, response_format="json")

            return my_result.get("verified") == leader_data.get("verified")

        verification = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        milestone_data["verification_result"] = verification
        if verification.get("verified", False):
            milestone_data["status"] = "VERIFIED"
        else:
            milestone_data["status"] = "REJECTED"

        self.milestones[milestone_id] = json.dumps(milestone_data)

    @gl.public.write
    def release_milestone_payout(
        self, milestone_id: str, recipient: str
    ) -> None:
        milestone_json = self.milestones.get(milestone_id, "")
        assert milestone_json != "", "Milestone not found"

        milestone_data = json.loads(milestone_json)
        assert milestone_data["status"] == "VERIFIED", "Milestone not verified"
        assert not milestone_data.get("paid", False), "Already paid"

        milestone_data["paid"] = True
        milestone_data["status"] = "PAID"
        self.milestones[milestone_id] = json.dumps(milestone_data)

        amount = u256(int(milestone_data["amount"]))
        gl.message.send_native_token(recipient, amount)
