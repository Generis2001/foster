# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import traceback


class GrantManager(gl.Contract):
    grants: TreeMap[str, str]
    grant_count: u256
    grant_balances: TreeMap[str, u256]
    grant_sponsors: TreeMap[str, str]
    grant_ids: DynArray[str]

    def __init__(self):
        self.grant_count = u256(0)
        self.grant_ids = DynArray[str]()

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
        log = []
        try:
            # ── Input logging ────────────────────────────────────────────────
            sender = str(gl.message.sender_address)
            deposit = int(gl.message.value)
            log.append(f"INPUT name={repr(name)}")
            log.append(f"INPUT total_budget={int(total_budget)}")
            log.append(f"INPUT max_grant_size={int(max_grant_size)}")
            log.append(f"INPUT deadline={int(deadline)}")
            log.append(f"INPUT deposit(msg.value)={deposit}")
            log.append(f"INPUT sender={sender}")

            # ── Validation ───────────────────────────────────────────────────
            assert name.strip() != "", \
                f"Grant name cannot be empty"
            log.append("VALID name non-empty")

            assert int(total_budget) > 0, \
                f"total_budget must be > 0, got {int(total_budget)}"
            log.append(f"VALID total_budget={int(total_budget)}")

            assert int(max_grant_size) > 0, \
                f"max_grant_size must be > 0, got {int(max_grant_size)}"
            log.append(f"VALID max_grant_size={int(max_grant_size)}")

            assert int(max_grant_size) <= int(total_budget), \
                f"max_grant_size ({int(max_grant_size)}) must be <= total_budget ({int(total_budget)})"
            log.append("VALID max_grant_size <= total_budget")

            assert int(deadline) > 0, \
                f"deadline must be > 0, got {int(deadline)}"
            log.append(f"VALID deadline={int(deadline)}")

            assert description.strip() != "", \
                f"Description cannot be empty"
            log.append("VALID description non-empty")

            assert eligibility.strip() != "", \
                f"Eligibility criteria cannot be empty"
            log.append("VALID eligibility non-empty")

            # ── Compute IDs ──────────────────────────────────────────────────
            grant_id = f"grant_{int(self.grant_count)}"
            log.append(f"COMPUTED grant_id={grant_id}")

            # ── Build grant data ─────────────────────────────────────────────
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
            grant_json = json.dumps(grant_data)
            log.append(f"COMPUTED grant_json len={len(grant_json)}")

            # ── State writes ─────────────────────────────────────────────────
            self.grants[grant_id] = grant_json
            log.append(f"WRITE grants[{grant_id}]")

            self.grant_balances[grant_id] = u256(deposit)
            log.append(f"WRITE grant_balances[{grant_id}]={deposit}")

            self.grant_sponsors[grant_id] = sender
            log.append(f"WRITE grant_sponsors[{grant_id}]={sender}")

            self.grant_ids.append(grant_id)
            log.append(f"WRITE grant_ids.append({grant_id})")

            self.grant_count = u256(int(self.grant_count) + 1)
            log.append(f"WRITE grant_count={int(self.grant_count)}")

            log.append("SUCCESS")
            return grant_id

        except Exception as e:
            tb = traceback.format_exc()
            last = " | ".join(log[-5:]) if log else "no steps logged"
            raise Exception(
                f"create_grant_program FAILED — {type(e).__name__}: {e} "
                f"| last_steps: [{last}] "
                f"| traceback: {tb.strip()}"
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
