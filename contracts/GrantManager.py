# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class GrantManager(gl.Contract):
    grants: TreeMap[str, str]
    grant_count: u256
    grant_balances: TreeMap[str, u256]
    grant_sponsors: TreeMap[str, str]
    grant_ids: DynArray[str]

    def __init__(self):
        self.grant_count = u256(0)

    @gl.public.view
    def get_grant(self, grant_id: str) -> str:
        return self.grants.get(grant_id, "")

    @gl.public.view
    def get_grant_balance(self, grant_id: str) -> u256:
        return self.grant_balances.get(grant_id, u256(0))

    @gl.public.view
    def get_all_grant_ids(self) -> list[str]:
        result = []
        for gid in self.grant_ids:
            result.append(gid)
        return result

    @gl.public.view
    def get_grant_count(self) -> u256:
        return self.grant_count

    @gl.public.write.payable
    def create_grant_program(
        self,
        name: str,
        description: str,
        total_budget: u256,
        focus_areas: str,
        max_grant_size: u256,
        deadline: u256,
        eligibility: str,
    ) -> str:
        grant_id = f"grant_{self.grant_count}"
        sponsor = gl.message.sender_address

        grant_data = {
            "id": grant_id,
            "name": name,
            "description": description,
            "total_budget": str(total_budget),
            "remaining_budget": str(total_budget),
            "focus_areas": focus_areas,
            "max_grant_size": str(max_grant_size),
            "deadline": str(deadline),
            "eligibility": eligibility,
            "sponsor": sponsor,
            "status": "ACTIVE",
            "proposal_count": 0,
            "funded_count": 0,
        }

        self.grants[grant_id] = json.dumps(grant_data)
        self.grant_balances[grant_id] = u256(gl.message.value)
        self.grant_sponsors[grant_id] = sponsor
        self.grant_ids.append(grant_id)
        self.grant_count = u256(int(self.grant_count) + 1)

        return grant_id

    @gl.public.write.payable
    def deposit_funds(self, grant_id: str) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", "Grant not found"

        current_balance = self.grant_balances.get(grant_id, u256(0))
        self.grant_balances[grant_id] = u256(int(current_balance) + int(gl.message.value))

        grant_data = json.loads(grant_json)
        grant_data["remaining_budget"] = str(int(grant_data.get("remaining_budget", "0")) + int(gl.message.value))
        self.grants[grant_id] = json.dumps(grant_data)

    @gl.public.write
    def update_grant_status(self, grant_id: str, status: str) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", "Grant not found"
        assert self.grant_sponsors.get(grant_id, "") == gl.message.sender_address, "Not sponsor"

        grant_data = json.loads(grant_json)
        grant_data["status"] = status
        self.grants[grant_id] = json.dumps(grant_data)

    @gl.public.write
    def release_grant_funding(self, grant_id: str, recipient: str, amount: u256) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", "Grant not found"

        current_balance = self.grant_balances.get(grant_id, u256(0))
        assert int(current_balance) >= int(amount), "Insufficient balance"

        self.grant_balances[grant_id] = u256(int(current_balance) - int(amount))

        grant_data = json.loads(grant_json)
        grant_data["remaining_budget"] = str(int(grant_data.get("remaining_budget", "0")) - int(amount))
        grant_data["funded_count"] = grant_data.get("funded_count", 0) + 1
        self.grants[grant_id] = json.dumps(grant_data)

        gl.message.send_native_token(recipient, amount)
