const { createClient, createAccount } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");
const { TransactionStatus } = require("genlayer-js/types");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = "0x2c8c9f53186a35719544aa147a1c6dde678ceb83e6e5e759730fdc799b246ba0";

async function deployContract(client, account, name, code) {
  console.log(`\nDeploying ${name}...`);
  const txHash = await client.deployContract({
    account,
    code,
    args: [],
    value: 0n,
    leaderOnly: false,
  });
  console.log(`  tx: ${txHash}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.FINALIZED,
    timeout: 120000,
  });

  const address = receipt?.data?.contract_address;
  console.log(`  ✓ ${name} deployed at: ${address}`);
  return address;
}

async function main() {
  const client = createClient({ chain: studionet });
  const account = createAccount(PRIVATE_KEY);

  console.log(`Deployer: ${account.address}`);
  const balance = await client.getBalance({ address: account.address });
  console.log(`Balance: ${(Number(balance) / 1e18).toFixed(4)} GEN\n`);

  const contractsDir = path.join(__dirname, "../contracts");

  const grantManagerCode = fs.readFileSync(
    path.join(contractsDir, "GrantManager.py"),
    "utf8"
  );
  const proposalManagerCode = fs.readFileSync(
    path.join(contractsDir, "ProposalManager.py"),
    "utf8"
  );
  const evaluationEngineCode = fs.readFileSync(
    path.join(contractsDir, "EvaluationEngine.py"),
    "utf8"
  );
  const milestoneManagerCode = fs.readFileSync(
    path.join(contractsDir, "MilestoneManager.py"),
    "utf8"
  );

  const addresses = {};

  try {
    addresses.grantManager = await deployContract(client, account, "GrantManager", grantManagerCode);
  } catch (e) {
    console.error("GrantManager deploy failed:", e.message);
  }

  try {
    addresses.proposalManager = await deployContract(client, account, "ProposalManager", proposalManagerCode);
  } catch (e) {
    console.error("ProposalManager deploy failed:", e.message);
  }

  try {
    addresses.evaluationEngine = await deployContract(client, account, "EvaluationEngine", evaluationEngineCode);
  } catch (e) {
    console.error("EvaluationEngine deploy failed:", e.message);
  }

  try {
    addresses.milestoneManager = await deployContract(client, account, "MilestoneManager", milestoneManagerCode);
  } catch (e) {
    console.error("MilestoneManager deploy failed:", e.message);
  }

  console.log("\n=== Deployment Complete ===");
  console.log("\nAdd these to .env.local:\n");

  const envContent = [
    `NEXT_PUBLIC_GRANT_MANAGER_ADDRESS=${addresses.grantManager || ""}`,
    `NEXT_PUBLIC_PROPOSAL_MANAGER_ADDRESS=${addresses.proposalManager || ""}`,
    `NEXT_PUBLIC_EVALUATION_ENGINE_ADDRESS=${addresses.evaluationEngine || ""}`,
    `NEXT_PUBLIC_MILESTONE_MANAGER_ADDRESS=${addresses.milestoneManager || ""}`,
  ].join("\n");

  console.log(envContent);

  // Write to .env.local automatically
  const envPath = path.join(__dirname, "../.env.local");
  fs.writeFileSync(envPath, envContent + "\n");
  console.log("\n✓ Written to .env.local");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
