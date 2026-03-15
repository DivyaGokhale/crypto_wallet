// --- Constants & Contract ABI ---

const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";

const CONTRACT_ABI = [
  "event Transfer(address indexed sender, address indexed receiver, uint amount, uint timestamp)",
  "function addTransaction(address receiver, uint amount) public payable",
  "function getTransactionCount() public view returns (uint256)"
];

//Global State
let provider;
let signer;
let contract;
let userAddress;

//DOM Elements
const connectBtn = document.getElementById("connect-btn");
const walletDetails = document.getElementById("wallet-details");
const walletAddressElem = document.getElementById("wallet-address");
const networkNameElem = document.getElementById("network-name");
const walletBalanceElem = document.getElementById("wallet-balance");

const transactionSection = document.getElementById("transaction-section");
const sendForm = document.getElementById("send-form");
const sendBtn = document.getElementById("send-btn");

const statusContainer = document.getElementById("status-container");
const statusMessage = document.getElementById("status-message");
const txHashLink = document.getElementById("tx-hash-link");


/**
 * Initialize Web3 provider and connect to MetaMask
 */
async function connectWallet() {
  // Check if MetaMask or any window.ethereum provider is installed
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask to use this dApp!");
    return;
  }

  try {
    // Request account access from MetaMask
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Initialize ethers v6 BrowserProvider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    // Initialize Contract instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Fetch network information
    const network = await provider.getNetwork();

    // Update the UI with connected state
    walletAddressElem.innerText = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    networkNameElem.innerText = network.name.charAt(0).toUpperCase() + network.name.slice(1);

    // Show connected UI elements
    connectBtn.classList.add("hidden");
    walletDetails.classList.remove("hidden");
    transactionSection.classList.remove("hidden");

    // Fetch and display the ETH balance
    await updateBalance();

    // Set up listeners for account or network changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());

  } catch (error) {
    console.error("Error connecting to wallet:", error);
    alert("Failed to connect wallet: " + error.message);
  }
}

/**
 * Handle account switching within MetaMask
 */
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    console.log('Please connect to MetaMask.');
    // Reset UI to disconnected state
    connectBtn.classList.remove("hidden");
    walletDetails.classList.add("hidden");
    transactionSection.classList.add("hidden");
  } else {
    // Re-initialize with the newly selected account
    await connectWallet();
  }
}

/**
 * Fetch and display the ETH balance of the connected wallet
 */
async function updateBalance() {
  if (!provider || !userAddress) return;

  try {
    const balanceWei = await provider.getBalance(userAddress);
    const balanceEth = ethers.formatEther(balanceWei);
    // Format to 4 decimal places for cleaner UI presentation
    walletBalanceElem.innerText = parseFloat(balanceEth).toFixed(4);
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

/**
 * Handle Send Transaction Form Submission
 */
async function sendTransaction(event) {
  event.preventDefault();

  const receiverAddress = document.getElementById("receiver").value.trim();
  const amountEth = document.getElementById("amount").value.trim();

  // Validate the receiver address format
  if (!ethers.isAddress(receiverAddress)) {
    alert("Invalid receiver address format. Please enter a valid Ethereum address.");
    return;
  }

  try {
    // Disable button to prevent multiple submissions
    sendBtn.disabled = true;
    sendBtn.innerText = "Processing...";

    // Reveal and update status container (Pending)
    statusContainer.classList.remove("hidden");
    statusMessage.className = "status pending";
    statusMessage.innerText = "Transaction Pending... Please confirm in MetaMask.";
    txHashLink.innerText = "Awaiting confirmation...";
    txHashLink.removeAttribute("href");

    // Convert ETH amount to Wei
    const parsedAmount = ethers.parseEther(amountEth);

    // Call the smart contract function `addTransaction`
    // We pass `{ value: parsedAmount }` so the ETH is actually transferred
    const tx = await contract.addTransaction(receiverAddress, parsedAmount, {
      value: parsedAmount
    });

    // Update UI with the transaction hash while it's mining
    statusMessage.innerText = "Transaction Submitted. Waiting for block confirmation...";
    txHashLink.innerText = `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`;

    // Set the block explorer URL (using Sepolia testnet)
    const explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
    txHashLink.setAttribute("href", explorerUrl);

    // Wait for the transaction to be mined/confirmed
    const receipt = await tx.wait();

    // Update UI on a successful confirmation
    statusMessage.className = "status confirmed";
    statusMessage.innerText = "Transaction Confirmed Successfully!";

    // Clear form inputs manually
    document.getElementById("receiver").value = "";
    document.getElementById("amount").value = "";

    // Refresh balance after the ETH has been deducted and gas paid
    await updateBalance();

  } catch (error) {
    console.error("Transaction execution failed:", error);
    statusMessage.className = "status error";

    // Parse rejection or other node errors
    if (error.code === 'ACTION_REJECTED' || error.info?.error?.code === 4001) {
      statusMessage.innerText = "Transaction rejected by user in MetaMask.";
    } else {
      statusMessage.innerText = "Transaction execution failed!";
    }
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
    sendBtn.innerText = "Send Transaction";
  }
}

//Event Listeners
connectBtn.addEventListener("click", connectWallet);
sendForm.addEventListener("submit", sendTransaction);
