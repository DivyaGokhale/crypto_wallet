# Decentralized Crypto Wallet

A complete decentralized cryptocurrency wallet web application built with HTML, CSS, Vanilla JavaScript, and Solidity. It interacts with the Ethereum Sepolia testnet using MetaMask and ethers.js.

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- [MetaMask](https://metamask.io/) browser extension installed and set up
- Some Sepolia test ETH in your MetaMask wallet 
## Installation & Setup

### 1. Smart Contract Development & Deployment

1. Open a terminal and navigate to the `smart-contract` folder:
   cd Cryptocurrency-Wallet-and-Transaction-Application/smart-contract

2. Initialize npm and install Hardhat and its dependencies:
   npm init -y
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   

3. Compile the smart contract:
   npx hardhat compile

4. Set up your environment variables:
   Update `hardhat.config.js` with your Sepolia RPC URL (from Alchemy or Infura) and your MetaMask private key.

5. Deploy the smart contract to the Sepolia testnet:
   npx hardhat run scripts/deploy.js --network sepolia

6. **IMPORTANT:** After deployment, the terminal will output the deployed contract address. Copy this address and update the `CONTRACT_ADDRESS` variable at the top of `Cryptocurrency-Wallet-and-Transaction-Application/frontend/app.js`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   cd Cryptocurrency-Wallet-and-Transaction-Application/frontend

2. Serve the directory using a local web server (needed to avoid CORS issues). If you don't have a web server installed globally, you can use `npx http-server`:
   npx http-server .

3. Open the provided local URL (e.g., `http://127.0.0.1:8080`) in your browser.
4. Connect your MetaMask wallet, switch to the **Sepolia** network, and start executing transactions!

## Features

- **Connect Wallet:** Click to connect MetaMask. Retrieves and displays your wallet address and the current network.
- **Display Balance:** Fetches your live Sepolia ETH balance and formats it appropriately.
- **Send Transactions:** A custom smart contract is used to securely route your ETH to the desired receiver while logging the transaction data on the blockchain.
- **Transaction Status:** Real-time feedback for transaction pending and confirmed states with a clickable block explorer link for the hash.
- **Receive Transactions:** Other users can send ETH to your wallet address by scanning the QR Code 
- **Transaction Logging:** Previous transactions are displayed
- **Contact Book:** Store and manage your contacts with their wallet addresses.s
