// GenLayer StudioNet client and contract interaction utilities
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export { TransactionStatus };

// Validates a raw env var string is a proper 0x-prefixed 20-byte hex address.
// Returns null for anything else (undefined, "", "undefined", wrong length, etc.)
function toAddress(raw: string | undefined): `0x${string}` | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return null;
  return trimmed as `0x${string}`;
}

// Deployed contract addresses — set via environment variables after deployment
export const CONTRACTS = {
  grantManager:     toAddress(process.env.NEXT_PUBLIC_GRANT_MANAGER_ADDRESS),
  proposalManager:  toAddress(process.env.NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS),
  evaluationEngine: toAddress(process.env.NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS),
  milestoneManager: toAddress(process.env.NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS),
};

export const STUDIONET_CHAIN = {
  id: 61999,
  name: "GenLayer StudioNet",
  rpc: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorer: "https://genlayer-explorer.vercel.app",
};

export function getReadClient() {
  return createClient({ chain: studionet });
}

function getWriteClient(account: string) {
  return createClient({ chain: studionet, account: account as `0x${string}` });
}

// Asserts an address is non-null before use — throws a clean error if not
export function requireAddress(addr: `0x${string}` | null, name = "Contract"): `0x${string}` {
  if (!addr) throw new Error(`${name} address not configured. Check your .env.local settings.`);
  return addr;
}

// Reads a view function from a contract
export async function readContract(address: `0x${string}`, fn: string, args: unknown[] = []) {
  const client = getReadClient();
  return client.readContract({
    address,
    functionName: fn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
  });
}

// Writes to a contract via connected wallet (MetaMask on StudioNet)
export async function writeContract(
  address: `0x${string}`,
  fn: string,
  args: unknown[],
  value?: bigint
) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet connected. Please install MetaMask.");
  }

  // Ensure we're on StudioNet
  await ensureStudioNet();

  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
  const account = accounts?.[0];
  if (!account || !/^0x[0-9a-fA-F]{40}$/.test(account)) {
    throw new Error("No valid wallet account found. Please connect MetaMask and try again.");
  }

  // Create a write client with the account string — genlayer-js will route
  // all eth_* calls through window.ethereum when account is a string (not a LocalAccount object)
  const client = getWriteClient(account);

  const txHash = await client.writeContract({
    address,
    functionName: fn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    value: value ?? 0n,
  });

  return txHash as string;
}

export async function waitForTx(hash: string) {
  const client = getReadClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as any,
    // ACCEPTED is the terminal state on StudioNet (FINALIZED may never arrive within timeout)
    status: TransactionStatus.ACCEPTED,
    retries: 40,   // 40 × 3 s = 2 minutes
    interval: 3000,
  });

  // Check if the intelligent contract execution actually succeeded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = receipt as any;
  const leaderReceipts: any[] = r?.consensus_data?.leader_receipt ?? [];
  for (const lr of leaderReceipts) {
    const status = lr?.result?.status ?? lr?.execution_result;
    if (status === "rollback" || status === "error" || status === "contract_error") {
      const reason = lr?.result?.payload ?? lr?.error ?? status;
      throw new Error(`Contract execution failed: ${reason}`);
    }
  }
  if (r?.txExecutionResultName === "FAILURE") {
    throw new Error("Contract execution failed (FAILURE). Check contract logs.");
  }

  return receipt;
}

export async function ensureStudioNet() {
  if (typeof window === "undefined" || !window.ethereum) return;

  const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
  if (parseInt(chainId, 16) === 61999) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xF22F" }],
    });
  } catch (err: unknown) {
    if ((err as { code: number }).code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xF22F",
            chainName: "GenLayer StudioNet",
            rpcUrls: ["https://studio.genlayer.com/api"],
            nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
            blockExplorerUrls: ["https://genlayer-explorer.vercel.app"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
