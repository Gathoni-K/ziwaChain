# ZiwaChain: Project Setup

Initial scaffolding for ZiwaChain, the verified circular-biomass chain of custody built for the IEEE ClimateChain hackathon (Track 3). This guide sets up a Solidity smart-contract project with Hardhat 2, TypeScript, and OpenZeppelin, targeting a public testnet.

**Goal of this document:** after following it, `npx hardhat compile` and `npx hardhat test` both pass, and the project has a clean first commit.

---

## 0. Prerequisites

- **Node.js 20 or newer** and npm
- **Git**
- A **fresh wallet used only for testnets** (never one that holds real funds)

```bash
node -v
git --version
```

**What it does:** prints the installed versions. If `node -v` shows something older than v20, upgrade Node before continuing (Hardhat needs a recent version).

---

## 1. Create the project

```bash
mkdir ziwachain && cd ziwachain
git init
npm init -y
```

| Command | What it does |
|---|---|
| `mkdir ziwachain && cd ziwachain` | Creates the project folder and moves into it. |
| `git init` | Starts version control. Your commit history will show the work was built during the hackathon window (Oct 5-25). |
| `npm init -y` | Creates `package.json` with default answers. This file tracks the project's dependencies and scripts. |

---

## 2. Install Hardhat and scaffold

```bash
npm install --save-dev hardhat@2
npx hardhat init
```

At the prompts: choose **Create a TypeScript project**, accept the defaults, and answer **yes** when asked to install the dependencies.

| Command | What it does |
|---|---|
| `npm install --save-dev hardhat@2` | Installs Hardhat version 2, the tool that compiles, tests, and deploys smart contracts. `--save-dev` marks it as a development tool. |
| `npx hardhat init` | Generates a starter project: a sample contract in `contracts/`, a sample test in `test/`, a deployment module in `ignition/`, and `hardhat.config.ts`. It also installs `hardhat-toolbox`, a bundle with testing, TypeScript, and gas-reporting tools. |

---

## 3. Add contract libraries and env handling

```bash
npm install @openzeppelin/contracts
npm install --save-dev dotenv
```

| Command | What it does |
|---|---|
| `npm install @openzeppelin/contracts` | Installs OpenZeppelin, a widely audited library of contract building blocks. We'll use its role-based access control instead of writing our own. |
| `npm install --save-dev dotenv` | Lets the project read secrets (keys, RPC URLs) from a `.env` file instead of putting them in code. |

---

## 4. Create the docs folders

```bash
mkdir -p docs/architecture docs/security docs/impact
```

**What it does:** creates three folders (`-p` also creates the parent `docs/`). The hackathon requires an architecture diagram and spec, a security and data integrity assessment, and a climate impact assessment. Starting these folders now means the write-ups grow alongside the code.

---

## 5. Keep secrets out of git

```bash
printf "\n.env\nnode_modules\ncache\nartifacts\ntypechain-types\ncoverage\n" >> .gitignore

cat > .env <<'EOF'
DEPLOYER_PRIVATE_KEY=
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
EOF
```

| Command | What it does |
|---|---|
| `printf "..." >> .gitignore` | Appends these names to `.gitignore` so git never tracks them. `.env` holds secrets. The others are generated folders that don't belong in the repo. |
| `cat > .env <<'EOF' ... EOF` | Writes a `.env` file with two settings: your deployer key (leave empty for now) and the public Base Sepolia RPC URL. |

**Rules for the key:** use a brand-new wallet with testnet funds only. Never commit `.env`. If a key is ever exposed, treat it as burned and make a new one.

---

## 6. Configure Hardhat

Replace the contents of `hardhat.config.ts` with:

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
      accounts,
    },
  },
};

export default config;
```

| Part | What it does |
|---|---|
| `import "@nomicfoundation/hardhat-toolbox"` | Turns on the toolbox plugins (tests, TypeScript types, gas reports). |
| `dotenv.config()` | Loads the values from `.env` into `process.env`. |
| `accounts` | Uses your deployer key if one is set, otherwise an empty list so compile and test still work without a key. |
| `solidity: "0.8.28"` | The Solidity compiler version for our contracts. OpenZeppelin v5 needs 0.8.20 or newer. |
| `networks.baseSepolia` | Defines the testnet we'll deploy to. |

---

## 7. Verify and make the first commit

```bash
npx hardhat compile
npx hardhat test
git add -A
git commit -m "chore: scaffold ZiwaChain (Hardhat + TypeScript + OpenZeppelin)"
```

| Command | What it does |
|---|---|
| `npx hardhat compile` | Compiles the sample contract into bytecode and generates TypeScript types. It creates the `artifacts/` and `typechain-types/` folders. |
| `npx hardhat test` | Runs the sample tests on a temporary in-memory blockchain. All tests should pass. |
| `git add -A` | Stages every new or changed file for the commit. |
| `git commit -m "..."` | Saves a snapshot with a message. Prefixes like `chore:` and `feat:` keep the history readable. |

**Done when:** compile succeeds, tests pass, and `git status` is clean.

---

## 8. Everyday commands

```bash
npx hardhat compile                                  # rebuild after editing contracts
npx hardhat test                                     # run all tests
npx hardhat node                                     # start a local blockchain you can deploy to
npx hardhat ignition deploy ignition/modules/Lock.ts --network baseSepolia   # deploy to the testnet
```

(`Lock.ts` is the sample module. We'll replace it with a ZiwaChain deployment module.)

---

## 9. Getting testnet funds (later, before deploying)

1. Create a new wallet and copy its private key into `DEPLOYER_PRIVATE_KEY` in `.env`.
2. Get Base Sepolia test ETH from a public faucet. Faucet availability changes, so search for a current "Base Sepolia faucet".
3. Never send real funds to this wallet.

---

## Troubleshooting

- **Config validation errors on start:** check `hardhat.config.ts` for typos and make sure no network has an empty `url`.
- **`Cannot find module '@nomicfoundation/hardhat-toolbox'`:** rerun `npm install`, or answer **yes** to dependency installation during `npx hardhat init`.
- **Compiler download fails:** check your internet connection and rerun `npx hardhat compile`. Hardhat downloads the Solidity compiler on first use.

---

## Next steps

1. Define the provenance event schema (one record per stage: hotspot, harvest, verification, buyer, processing, end use).
2. Write the batch contract as a state machine with role-based access.
3. Write tests for every valid and invalid stage transition.