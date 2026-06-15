// GenLayer StudioNet client and contract interaction utilities
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export { TransactionStatus };

// Deployed contract addresses — set via environment variables after deployment
export const CONTRACTS = {
  grantManager: (process.env.NEXT_PUBLIC_GRANT_MANAGER_ADDRESS || "") as `0x${string}`,
  proposalManager: (process.env.NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS || "") as `0x${string}`,
  evaluationEngine: (process.env.NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS || "") as `0x${string}`,
  milestoneManager: (process.env.NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS || "") as `0x${string}`,
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

  const client = getReadClient();

  // Ensure we're on StudioNet
  await ensureStudioNet();

  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
  if (!accounts.length) {
    throw new Error("No wallet connected.");
  }

  const txHash = await client.writeContract({
    address,
    functionName: fn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    value: value ?? 0n,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: accounts[0] as any,
  });

  return txHash as string;
}

export async function waitForTx(hash: string) {
  const client = getReadClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.waitForTransactionReceipt({
    hash: hash as any,
    status: TransactionStatus.FINALIZED,
  });
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
