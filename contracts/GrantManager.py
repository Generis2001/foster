# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class GrantManager(gl.Contract):
    grants: TreeMap[str, str]
    grant_count: u256
    grant_balances: TreeMap[str, u256]
    grant_sponsors: TreeMap[str, str]

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
        return [f"grant_{i}" for i in range(int(self.grant_count))]

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
        log = []
        try:
            sender = str(gl.message.sender_address)
            deposit = int(gl.message.value)
            log.append(f"sender={sender}")
            log.append(f"deposit={deposit}")
            log.append(f"total_budget={int(total_budget)}")
            log.append(f"max_grant_size={int(max_grant_size)}")
            log.append(f"deadline={int(deadline)}")
            log.append(f"name={repr(name)}")

            assert name.strip() != "", "Grant name cannot be empty"
            log.append("VALID:name")

            assert int(total_budget) > 0, \
                f"total_budget must be > 0, got {int(total_budget)}"
            log.append("VALID:total_budget")

            assert int(max_grant_size) > 0, \
                f"max_grant_size must be > 0, got {int(max_grant_size)}"
            log.append("VALID:max_grant_size")

            assert int(max_grant_size) <= int(total_budget), \
                f"max_grant_size {int(max_grant_size)} > total_budget {int(total_budget)}"
            log.append("VALID:max<=budget")

            assert int(deadline) > 0, \
                f"deadline must be > 0, got {int(deadline)}"
            log.append("VALID:deadline")

            assert description.strip() != "", "Description cannot be empty"
            log.append("VALID:description")

            assert eligibility.strip() != "", "Eligibility cannot be empty"
            log.append("VALID:eligibility")

            grant_id = f"grant_{int(self.grant_count)}"
            log.append(f"grant_id={grant_id}")

            grant_data = {
                "id": grant_id,
                "name": name,
                "description": description,
                "total_budget": str(int(total_budget)),
                "remaining_budget": str(int(total_budget)),
                "focus_areas": focus_areas,
                "max_grant_size": str(int(max_grant_size)),
                "deadline": str(int(deadline)),
                "eligibility": eligibility,
                "sponsor": sender,
                "status": "ACTIVE",
                "proposal_count": 0,
                "funded_count": 0,
            }

            self.grants[grant_id] = json.dumps(grant_data)
            log.append(f"WRITE:grants[{grant_id}]")

            self.grant_balances[grant_id] = u256(deposit)
            log.append(f"WRITE:grant_balances={deposit}")

            self.grant_sponsors[grant_id] = sender
            log.append(f"WRITE:grant_sponsors={sender}")

            self.grant_count = u256(int(self.grant_count) + 1)
            log.append(f"WRITE:grant_count={int(self.grant_count)}")

            return grant_id

        except AssertionError as e:
            raise AssertionError(f"{e} [steps: {' | '.join(log[-4:])}]")
        except Exception as e:
            raise Exception(
                f"{type(e).__name__}: {e} [steps: {' | '.join(log[-4:])}]"
            )

    @gl.public.write.payable
    def deposit_funds(self, grant_id: str) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", f"Grant not found: {grant_id}"

        deposit = int(gl.message.value)
        current_balance = int(self.grant_balances.get(grant_id, u256(0)))
        self.grant_balances[grant_id] = u256(current_balance + deposit)

        grant_data = json.loads(grant_json)
        grant_data["remaining_budget"] = str(
            int(grant_data.get("remaining_budget", "0")) + deposit
        )
        self.grants[grant_id] = json.dumps(grant_data)

    @gl.public.write
    def update_grant_status(self, grant_id: str, status: str) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", f"Grant not found: {grant_id}"
        assert self.grant_sponsors.get(grant_id, "") == str(gl.message.sender_address), \
            f"Not sponsor: caller={gl.message.sender_address}"

        grant_data = json.loads(grant_json)
        grant_data["status"] = status
        self.grants[grant_id] = json.dumps(grant_data)

    @gl.public.write
    def release_grant_funding(self, grant_id: str, recipient: str, amount: u256) -> None:
        grant_json = self.grants.get(grant_id, "")
        assert grant_json != "", f"Grant not found: {grant_id}"

        current_balance = int(self.grant_balances.get(grant_id, u256(0)))
        assert current_balance >= int(amount), \
            f"Insufficient balance: have {current_balance}, need {int(amount)}"

        self.grant_balances[grant_id] = u256(current_balance - int(amount))

        grant_data = json.loads(grant_json)
        grant_data["remaining_budget"] = str(
            int(grant_data.get("remaining_budget", "0")) - int(amount)
        )
        grant_data["funded_count"] = grant_data.get("funded_count", 0) + 1
        self.grants[grant_id] = json.dumps(grant_data)

        gl.message.send_native_token(recipient, amount)
