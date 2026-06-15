const { createClient, simplifyTransactionReceipt } = require("genlayer-js");
const { studionet } = require("genlayer-js/chains");

const client = createClient({ chain: studionet });

const txs = {
  ProposalManager: "0x6bcd7a377dc0822e46bc0dced1c3c8f5f5d1c0ad4255265a1162bfeaf4a8e18d",
  EvaluationEngine: "0xe73e054652e4fc962b4b886e38d035611fb0e8fb18dbc027982095018220489e",
  MilestoneManager: "0xf14411fc09637795651f338bb2ef33aaf1730bdc62c5edff1c7d302bf0717d0b",
};

async function main() {
  for (const [name, hash] of Object.entries(txs)) {
    try {
      const receipt = await client.getTransactionReceipt({ hash });
      // Extract useful fields only
      const info = {
        status: receipt?.status,
        to: receipt?.to,
        from: receipt?.from,
        contractAddress: receipt?.contractAddress,
      };
      // Also look at the raw receipt for contract address
      const raw = Object.fromEntries(
        Object.entries(receipt || {}).filter(([k]) =>
          ["contractAddress", "to", "from", "status", "transactionHash"].includes(k)
        )
      );
      console.log(`\n${name}: ${JSON.stringify(raw)}`);

      // Try the simplify helper
      try {
        const simplified = simplifyTransactionReceipt(receipt);
        console.log(`  simplified:`, simplified?.contract_address || simplified);
      } catch(e2) {
        // ignore
      }
    } catch (e) {
      console.log(`${name}: error - ${e.message}`);
    }
  }
}

main().catch(console.error);
