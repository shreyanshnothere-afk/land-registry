# TerraLedger | Decentralized Land Registry on Stellar & Soroban

![Stellar Soroban](https://img.shields.io/badge/Stellar-Soroban%20Smart%20Contracts-00F2FE?style=for-the-badge&logo=stellar)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-7928CA?style=for-the-badge&logo=nextdotjs)
![Rust](https://img.shields.io/badge/Contract-Rust%20Soroban%20SDK-black?style=for-the-badge&logo=rust)
![Freighter Wallet](https://img.shields.io/badge/Wallet-Freighter%20Integration-10B981?style=for-the-badge)

## Overview
TerraLedger is a production-grade Web3 application designed to bring transparency, immutability, and instant verification to real estate title ownership using Soroban Smart Contracts on the Stellar Testnet. 

Traditional land registration systems suffer from fraud, double-selling of properties, slow title searches, opaque records, and expensive intermediary conveyancing fees. TerraLedger solves this by tokenizing unique land parcels onto the Stellar blockchain. Each land parcel is registered with a unique Property ID linked directly to an owner's Stellar Wallet address, ensuring absolute proof of ownership and secure on-chain transfers.

## Features
* **Immutable Proof of Ownership**: Land records are verified directly on-chain and cannot be tampered with.
* **Instant Title Transfers**: Atomic ownership handovers authorized by the current owner via Freighter Wallet signatures.
* **Register Property Form**: Input unique cadastral property IDs and execute on-chain contract calls to register land.
* **Verify Ownership Search**: Read-only instant search fetching real-time on-chain title records from the Soroban RPC.
* **On-Chain Land Ledger**: Live interactive table tracking tokenized land records with deep links to the Stellar Expert Explorer.
* **Testnet Friendbot Faucet**: 1-click funding button to receive 10,000 Testnet XLM directly inside the dashboard.
* **Low Gas Fees**: Transactions cost a fraction of a cent (~0.00001 XLM).

## Tech Stack
* **Smart Contract Engine**: Soroban SDK (Rust)
* **Blockchain Network**: Stellar Testnet (https://soroban-testnet.stellar.org)
* **Wallet Connection**: Freighter API (@stellar/freighter-api)
* **Blockchain SDK**: @stellar/stellar-sdk
* **Frontend Framework**: Next.js 14 (App Router) + TypeScript
* **Styling & UI**: Tailwind CSS + Custom Dark Mode Glassmorphism + Lucide Icons

## Setup Instructions
1. Clone the repository to your local machine.
2. Ensure you have Node.js (v18 or higher) and Rust & Cargo (v1.74+) installed.
3. Install the Stellar CLI for contract compilation and deployment.
4. You will need to compile the backend in the `/contracts` directory and run the frontend in the `/frontend` directory.

## Environment Variables
Create a `.env.local` file in the root of your `/frontend` directory and add the following required variables:

```env
NEXT_PUBLIC_CONTRACT_ID=CCAF3TFWLDPYCKUIXTL2ZRYSWH4Z5JBZLUNX6MFTGTDGMQAUCPLKIS3Z
NEXT_PUBLIC_SOROBAN_RPC_URL=[https://soroban-testnet.stellar.org:443](https://soroban-testnet.stellar.org:443)
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

## Wallet Setup
1. Download and install the Freighter Wallet Browser Extension.
2. Follow the prompt to create a new wallet and securely back up your 12-word seed phrase.
3. Open the extension, click the Settings (Gear) Icon -> Network -> Select Testnet.
4. Use the in-app Friendbot feature or the TerraLedger dashboard button to fund your testnet address with free XLM for gas fees.

## Contract Deployment
To build and deploy the smart contract to the Stellar Testnet, navigate into the `/contracts` directory and run:

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Compile the contract
cargo build --target wasm32-unknown-unknown --release

# Add Testnet network to Stellar CLI
stellar network add --global testnet \
  --rpc-url [https://soroban-testnet.stellar.org](https://soroban-testnet.stellar.org) \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate and fund a local deployment identity
stellar keys generate admin --global --network testnet
stellar keys fund admin --network testnet

# Deploy the contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/land_registry_contract.wasm \
  --source admin \
  --network testnet
```

## Running Locally
To start the Next.js UI, navigate into the `/frontend` directory and run:

```bash
npm install
npm run dev
```
Open http://localhost:3000 in your browser to interact with the TerraLedger dApp.

## Deployment
To deploy the frontend application to Vercel:
1. Push your complete code (contracts and frontend) to a GitHub repository.
2. Log in to Vercel and click Add New Project.
3. Import your GitHub repository.
4. Set the Root Directory to frontend.
5. Ensure the Framework Preset is detected as Next.js.
6. Add your Environment Variables in the Vercel dashboard.
7. Click Deploy.

## Contract Address
CCAF3TFWLDPYCKUIXTL2ZRYSWH4Z5JBZLUNX6MFTGTDGMQAUCPLKIS3Z

## Example Transaction Hash
7492f982e6a7f4353101dffe2f5cd900e177583353166e6c1edb6904b550882c