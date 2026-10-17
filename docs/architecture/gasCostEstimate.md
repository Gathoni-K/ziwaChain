# ZiwaChain: Gas Cost Estimate

> [!IMPORTANT]
> **COST ESTIMATE — NOT AUDITED FIGURES**
> All gas unit values are measured from automated tests run on the local Hardhat network
> with Solidity 0.8.28, EVM version `cancun`, optimiser **off** (default test build).
> Gas units are exact measurements. ETH-per-gas and USD costs are estimates based on
> publicly observable Base Sepolia and Base mainnet conditions and **are not guaranteed**.

---

## 1. Measurement Method

Gas measurements were produced by `hardhat-gas-reporter` v2.3.0 running against the full
94-test suite on a local Hardhat EVM node.

Command to reproduce:
```bash
REPORT_GAS=true npx hardhat test
# Output written to docs/architecture/gasReport.txt
```

Source file: [`docs/architecture/gasReport.txt`](gasReport.txt)
Test run date: Oct 17, 2026

---

## 2. Gas Units Per Function (Measured)

| Contract Function | Min Gas | Avg Gas | Max Gas | Notes |
|---|---|---|---|---|
| `logHarvest` | 165,193 | 165,214 | 165,217 | First call per batch; sets all storage slots |
| `verifyBatch` | 82,218 | 82,230 | 82,230 | Approve or reject; updates stage enum |
| `acceptBatch` | 125,711 | 125,734 | 125,735 | Sets acceptedKg and paymentRefHash |
| `confirmSettlement` | 97,462 | 97,549 | 97,898 | Sets settled flag and confirmationHash |
| `recordProcessing` | n/a | 104,314 | n/a | Sets processedKg and processor address |
| `recordEndUse` | 86,478 | 133,197 | 140,384 | Lower on first call (no ERC-1155 storage warm-up); higher when minting to a new token ID slot |
| `correctRecord` | n/a | 76,876 | n/a | Writes supersession mapping |
| `grantRole` | 52,012 | 52,021 | 52,024 | OpenZeppelin AccessControl; one-time per actor per role |

### Contract Deployment

| Contract | Gas Units | % of 30M Block Limit |
|---|---|---|
| `ZiwaChain.sol` | 3,840,851 | 12.8% |
| `PlainRelayer.sol` (test mock only) | 213,952 | 0.7% |

---

## 3. Full Batch Journey (One Batch, No Corrections)

Summing the measured averages for one Batch A journey (logHarvest → verifyBatch → acceptBatch → confirmSettlement → recordProcessing → recordEndUse × 1):

| Step | Gas (avg) |
|---|---|
| logHarvest | 165,214 |
| verifyBatch | 82,230 |
| acceptBatch | 125,734 |
| confirmSettlement | 97,549 |
| recordProcessing | 104,314 |
| recordEndUse (1 call) | 133,197 |
| **Total** | **708,238** |

---

## 4. ETH and USD Cost Estimate

> [!CAUTION]
> **ESTIMATE ONLY.** The values below are calculated from observed gas prices and are
> not a commitment. Gas prices fluctuate continuously. Verify current conditions on
> [Basescan gas tracker](https://sepolia.basescan.org) before deployment decisions.

### Fee Assumptions (Source: Base Mainnet observations, Oct 2026)

Base L2 uses a two-component fee:

- **L2 execution fee:** `gasUsed × baseFee_L2`. Base mainnet base fees are typically **0.001 to 0.01 Gwei** at normal throughput.
- **L1 data fee:** estimated at roughly **0.10 USD per transaction** at current ETH price on Base mainnet. This is the dominant cost on L2. Varies with ETH price and Ethereum L1 data fee.

Source: Base fee documentation at [docs.base.org/docs/fees](https://docs.base.org/docs/fees) and community gas tracker observations.

### Low Estimate (Base fee = 0.001 Gwei, ETH = $2,000)

Full journey (708,238 gas at 0.001 Gwei):
- L2 execution: 708,238 × 0.000000001 ETH = 0.000000708 ETH = ~$0.0014
- L1 data fee (6 transactions × ~$0.10): ~$0.60
- **Total one batch (low): ~$0.60**

### High Estimate (Base fee = 0.01 Gwei, ETH = $4,000)

- L2 execution: 708,238 × 0.00000001 ETH = 0.00000708 ETH = ~$0.028
- L1 data fee (6 transactions × ~$0.30 peak): ~$1.80
- **Total one batch (high): ~$1.83**

### Deployment (one-time)

At 3,840,851 gas:

| Condition | L2 execution cost | L1 data fee (1 tx) | Approximate total |
|---|---|---|---|
| Low (0.001 Gwei, $2k ETH) | ~$0.008 | ~$0.30 | **~$0.31** |
| High (0.01 Gwei, $4k ETH) | ~$0.15 | ~$1.00 | **~$1.15** |

---

## 5. Notes and Limitations

1. **Optimiser is off in tests.** Enabling the Solidity optimiser (e.g. 200 runs) typically reduces gas by 5 to 20 percent. The table above is a conservative upper bound for the unoptimised build.
2. **`recordEndUse` range is wide.** The first call to `recordEndUse` for a given token ID slot is more expensive (cold storage write, ~86k gas) than subsequent calls for the same batch (warm storage, ~140k gas for the full ERC-1155 mint path). Batches with one end-use call cost less; batches with multiple end-use calls have higher totals.
3. **These are testnet figures.** Gas units are deterministic and identical between testnet and mainnet for the same code. Only gas price (Gwei) changes between networks.
4. **L1 data fee dominates on L2.** On Base (Optimism stack), the L1 data posting fee per transaction often exceeds the L2 execution fee by one to two orders of magnitude. Per-transaction L1 data fees depend on calldata size, L1 base fee, and the OP blob-pricing model. For accurate production cost planning, measure with `eth_estimateGas` on a live Base Sepolia deployment.
