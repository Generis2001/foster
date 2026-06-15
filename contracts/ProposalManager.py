# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ProposalManager(gl.Contract):
    proposals: TreeMap[str, str]
    proposal_count: u256
    grant_proposals: TreeMap[str, DynArray[str]]
    proposer_proposals: TreeMap[str, DynArray[str]]

    def __init__(self):
        self.proposal_count = u256(0)

    @gl.public.view
    def get_proposal(self, proposal_id: str) -> str:
        return self.proposals.get(proposal_id, "")

    @gl.public.view
    def get_proposals_for_grant(self, grant_id: str) -> list[str]:
        result = []
        arr = self.grant_proposals.get(grant_id, DynArray[str]())
        for pid in arr:
            result.append(pid)
        return result

    @gl.public.view
    def get_proposals_by_proposer(self, proposer: str) -> list[str]:
        result = []
        arr = self.proposer_proposals.get(proposer, DynArray[str]())
        for pid in arr:
            result.append(pid)
        return result

    @gl.public.view
    def get_proposal_count(self) -> u256:
        return self.proposal_count

    @gl.public.write
    def submit_proposal(
        self,
        grant_id: str,
        title: str,
        abstract_: str,
        full_description: str,
        requested_amount: u256,
        team_info: str,
        roadmap: str,
        impact_statement: str,
        github_url: str,
        website_url: str,
    ) -> str:
        proposal_id = f"prop_{self.proposal_count}"
        proposer = gl.message.sender_address

        proposal_data = {
            "id": proposal_id,
            "grant_id": grant_id,
            "title": title,
            "abstract": abstract_,
            "full_description": full_description,
            "requested_amount": str(requested_amount),
            "team_info": team_info,
            "roadmap": roadmap,
            "impact_statement": impact_statement,
            "github_url": github_url,
            "website_url": website_url,
            "proposer": proposer,
            "status": "PENDING",
            "submitted_at": str(gl.message.timestamp) if hasattr(gl.message, "timestamp") else "0",
            "evaluation_score": None,
            "evaluation_recommendation": None,
            "appeal_count": 0,
        }

        self.proposals[proposal_id] = json.dumps(proposal_data)

        if grant_id not in self.grant_proposals:
            self.grant_proposals[grant_id] = DynArray[str]()
        self.grant_proposals[grant_id].append(proposal_id)

        if proposer not in self.proposer_proposals:
            self.proposer_proposals[proposer] = DynArray[str]()
        self.proposer_proposals[proposer].append(proposal_id)

        self.proposal_count = u256(int(self.proposal_count) + 1)
        return proposal_id

    @gl.public.write
    def update_proposal(
        self,
        proposal_id: str,
        title: str,
        abstract_: str,
        full_description: str,
        requested_amount: u256,
        roadmap: str,
        impact_statement: str,
    ) -> None:
        proposal_json = self.proposals.get(proposal_id, "")
        assert proposal_json != "", "Proposal not found"

        proposal_data = json.loads(proposal_json)
        assert proposal_data["proposer"] == gl.message.sender_address, "Not proposer"
        assert proposal_data["status"] == "PENDING", "Cannot update non-pending proposal"

        proposal_data["title"] = title
        proposal_data["abstract"] = abstract_
        proposal_data["full_description"] = full_description
        proposal_data["requested_amount"] = str(requested_amount)
        proposal_data["roadmap"] = roadmap
        proposal_data["impact_statement"] = impact_statement

        self.proposals[proposal_id] = json.dumps(proposal_data)

    @gl.public.write
    def update_proposal_status(self, proposal_id: str, status: str) -> None:
        proposal_json = self.proposals.get(proposal_id, "")
        assert proposal_json != "", "Proposal not found"

        proposal_data = json.loads(proposal_json)
        proposal_data["status"] = status
        self.proposals[proposal_id] = json.dumps(proposal_data)

    @gl.public.write
    def request_appeal(self, proposal_id: str, reason: str) -> None:
        proposal_json = self.proposals.get(proposal_id, "")
        assert proposal_json != "", "Proposal not found"

        proposal_data = json.loads(proposal_json)
        assert proposal_data["proposer"] == gl.message.sender_address, "Not proposer"
        assert proposal_data["status"] in ["REJECTED", "REVISION_REQUESTED"], "Cannot appeal"

        proposal_data["status"] = "APPEALED"
        proposal_data["appeal_count"] = proposal_data.get("appeal_count", 0) + 1
        proposal_data["appeal_reason"] = reason
        self.proposals[proposal_id] = json.dumps(proposal_data)

    @gl.public.write
    def set_evaluation_result(
        self, proposal_id: str, score: u32, recommendation: str, evaluation_id: str
    ) -> None:
        proposal_json = self.proposals.get(proposal_id, "")
        assert proposal_json != "", "Proposal not found"

        proposal_data = json.loads(proposal_json)
        proposal_data["evaluation_score"] = int(score)
        proposal_data["evaluation_recommendation"] = recommendation
        proposal_data["evaluation_id"] = evaluation_id

        if recommendation == "APPROVE":
            proposal_data["status"] = "APPROVED"
        elif recommendation == "REJECT":
            proposal_data["status"] = "REJECTED"
        else:
            proposal_data["status"] = "REVISION_REQUESTED"

        self.proposals[proposal_id] = json.dumps(proposal_data)
