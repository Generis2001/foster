// Deploy Foster contracts to GenLayer StudioNet — patches fetch to use https (WSL2 fix)
import https from "https";
import fs from "fs";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Patch globalThis.fetch: undici fails in WSL2 due to IPv6/routing, https module works
globalThis.fetch = function patchedFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const body = opts.body;
    const bodyBuf = body ? (typeof body === "string" ? Buffer.from(body) : body) : null;
    const reqOpts = {
      hostname: "104.21.53.84",   // studio.genlayer.com IPv4
      port: 443,
      path: new URL(url).pathname,
      method: opts.method || "GET",
      headers: {
        ...(opts.headers || {}),
        Host: "studio.genlayer.com",
        "User-Agent": "genlayer-deploy/1.0",
        ...(bodyBuf ? { "Content-Length": bodyBuf.length } : {}),
      },
    };
    const req = https.request(reqOpts, (res) => {
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: { get: (k) => res.headers[k.toLowerCase()] },
          json: () => Promise.resolve(JSON.parse(raw)),
          text: () => Promise.resolve(raw),
        });
      });
    });
    req.setTimeout(30000);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
};

const PRIVATE_KEY = process.env.DEPLOY_PK;
if (!PRIVATE_KEY) { console.error("Set DEPLOY_PK env var"); process.exit(1); }

const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Account:", account.address);

const client = createClient({ chain: studionet, account });

const contracts = [
  { name: "GrantManager",     path: "contracts/GrantManager.py",     envKey: "NEXT_PUBLIC_GRANT_MANAGER_ADDRESS" },
  { name: "ProposalManager",  path: "contracts/ProposalManager.py",  envKey: "NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS" },
  { name: "EvaluationEngine", path: "contracts/EvaluationEngine.py", envKey: "NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS" },
  { name: "MilestoneManager", path: "contracts/MilestoneManager.py", envKey: "NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS" },
];

const results = {};

for (const { name, path, envKey } of contracts) {
  console.log(`\nDeploying ${name}...`);
  const code = fs.readFileSync(path, "utf8");
  try {
    const txHash = await client.deployContract({ code, args: [] });
    console.log(`  tx: ${txHash}`);
    console.log("  Waiting for consensus (~2 min)...");
    const receipt = await client.waitForTransactionReceipt({ hash: txHash, retries: 40, interval: 3000 });
    const address = receipt?.data?.contract_address ?? receipt?.contractAddress ?? receipt?.to;
    console.log(`  ✓ ${name}: ${address}`);
    results[envKey] = address;
  } catch (e) {
    console.error(`  ✗ ${name} failed: ${e.message}`);
    process.exit(1);
  }
}

console.log("\n=== New .env.local ===");
for (const [key, val] of Object.entries(results)) {
  console.log(`${key}=${val}`);
}
