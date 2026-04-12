const CONTRACT_ADDRESS = "0x79E673F0aA40C77bc2D115a8Ba0d6E67Fb08E322";

const CONTRACT_ABI = [
  "event Transfer(address indexed sender, address indexed receiver, uint amount, uint timestamp)",
  "function sendTransaction(address receiver) public payable",
  "function getAllTransactions() public view returns (tuple(address sender, address receiver, uint256 amount, uint256 timestamp)[])"
];

let provider, signer, contract, userAddress;

// DOM
const connectBtn = document.getElementById("connect-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const connectedUI = document.getElementById("connected-ui");

const walletDetails = document.getElementById("wallet-details");
const walletAddressElem = document.getElementById("wallet-address");
const walletBalanceElem = document.getElementById("wallet-balance");
const networkNameElem = document.getElementById("network-name");
const shortAddressElem = document.getElementById("short-address");

const transactionSection = document.getElementById("transaction-section");
const historySection = document.getElementById("history-section");

const sendForm = document.getElementById("send-form");
const sendBtn = document.getElementById("send-btn");

const statusContainer = document.getElementById("status-container");
const statusMessage = document.getElementById("status-message");
const txHashLink = document.getElementById("tx-hash-link");

const historyBody = document.getElementById("history-body");


// CONNECT WALLET
async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    return;
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const network = await provider.getNetwork();

  const short = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;

  walletAddressElem.innerText = short;
  shortAddressElem.innerText = short;
  networkNameElem.innerText = network.name;

  connectBtn.classList.add("hidden");
  connectedUI.classList.remove("hidden");

  walletDetails.classList.remove("hidden");
  transactionSection.classList.remove("hidden");
  historySection.classList.remove("hidden");

  updateBalance();
  updateHistory();
}


// DISCONNECT
disconnectBtn.addEventListener("click", () => {
  connectBtn.classList.remove("hidden");
  connectedUI.classList.add("hidden");

  walletDetails.classList.add("hidden");
  transactionSection.classList.add("hidden");
  historySection.classList.add("hidden");

  walletAddressElem.innerText = "Not connected";
  walletBalanceElem.innerText = "0.00";
  networkNameElem.innerText = "Unknown";

  userAddress = null;
});


// BALANCE
async function updateBalance() {
  const balance = await provider.getBalance(userAddress);
  walletBalanceElem.innerText =
    parseFloat(ethers.formatEther(balance)).toFixed(4);
}


// SEND TX
sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value;
  const amount = document.getElementById("amount").value;

  try {
    sendBtn.disabled = true;

    statusContainer.classList.remove("hidden");
    statusMessage.innerText = "Pending...";

    const tx = await contract.sendTransaction(receiver, {
      value: ethers.parseEther(amount)
    });

    txHashLink.innerText = tx.hash.slice(0, 10) + "...";
    txHashLink.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    await tx.wait();

    statusMessage.innerText = "Success!";
    updateBalance();
    updateHistory();

  } catch (err) {
    statusMessage.innerText = "Failed!";
  }

  sendBtn.disabled = false;
});


// HISTORY
async function updateHistory() {
  const txs = await contract.getAllTransactions();
  historyBody.innerHTML = "";

  txs.reverse().forEach(tx => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${tx.sender.slice(0,6)}...</td>
      <td>${tx.receiver.slice(0,6)}...</td>
      <td>${ethers.formatEther(tx.amount)}</td>
      <td>${new Date(Number(tx.timestamp)*1000).toLocaleString()}</td>
    `;

    historyBody.appendChild(row);
  });
}


// EVENTS
connectBtn.addEventListener("click", connectWallet);