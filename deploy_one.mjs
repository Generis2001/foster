// Deploy a single contract to GenLayer StudioNet
import https from "https";
import fs from "fs";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

globalThis.fetch = function patchedFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const body = opts.body;
    const bodyBuf = body ? (typeof body === "string" ? Buffer.from(body) : body) : null;
    const reqOpts = {
      hostname: "104.21.53.84",
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
const CONTRACT_PATH = process.argv[2];
if (!PRIVATE_KEY || !CONTRACT_PATH) {
  console.error("Usage: DEPLOY_PK=0x... node deploy_one.mjs <path/to/Contract.py>");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Account:", account.address);

const client = createClient({ chain: studionet, account });
const code = fs.readFileSync(CONTRACT_PATH, "utf8");
const name = CONTRACT_PATH.split("/").pop().replace(".py", "");

console.log(`\nDeploying ${name} from ${CONTRACT_PATH}...`);
const txHash = await client.deployContract({ code, args: [] });
console.log(`tx: ${txHash}`);
console.log("Waiting for consensus (~2 min)...");

const receipt = await client.waitForTransactionReceipt({ hash: txHash, retries: 40, interval: 3000 });
const address = receipt?.data?.contract_address ?? receipt?.contractAddress ?? receipt?.to;
console.log(`\n✓ ${name}: ${address}`);
console.log(`\nAdd to .env.local:`);

const envMap = {
  GrantManager:     "NEXT_PUBLIC_GRANT_MANAGER_ADDRESS",
  ProposalManager:  "NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS",
  EvaluationEngine: "NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS",
  MilestoneManager: "NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS",
};
const envKey = envMap[name] || `NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS`;
console.log(`${envKey}=${address}`);
