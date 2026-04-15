// ─── CONTRACT CONFIG ────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x756aCD31E2Bf0727652af18063FD1D00937E399a";

const CONTRACT_ABI = [
  "event Transfer(address indexed sender, address indexed receiver, uint amount, uint timestamp)",
  "function sendTransaction(address receiver) public payable",
  "function getAllTransactions() public view returns (tuple(address sender, address receiver, uint256 amount, uint256 timestamp)[])"
];

// ─── STATE ───────────────────────────────────────────────────────────────────
let provider, signer, contract, userAddress;
let allTransactions = [];      // cache of raw on-chain txs
let activeFilter = "all";      // "all" | "sent" | "received"

// ─── DOM REFS ────────────────────────────────────────────────────────────────
const connectBtn      = document.getElementById("connect-btn");
const disconnectBtn   = document.getElementById("disconnect-btn");
const connectedUI     = document.getElementById("connected-ui");
const walletDetails   = document.getElementById("wallet-details");
const walletAddrElem  = document.getElementById("wallet-address");
const walletBalElem   = document.getElementById("wallet-balance");
const networkNameElem = document.getElementById("network-name");
const shortAddrElem   = document.getElementById("short-address");

const transactionSection  = document.getElementById("transaction-section");
const historySection      = document.getElementById("history-section");
const addressBookSection  = document.getElementById("address-book-section");
const historyBody         = document.getElementById("history-body");
const historyEmpty        = document.getElementById("history-empty");
const historyEmptyMsg     = document.getElementById("history-empty-msg");

const sendForm        = document.getElementById("send-form");
const sendBtn         = document.getElementById("send-btn");
const statusContainer = document.getElementById("status-container");
const statusMessage   = document.getElementById("status-message");
const txHashLink      = document.getElementById("tx-hash-link");

// QR
const qrBtn       = document.getElementById("qr-btn");
const qrModal     = document.getElementById("qr-modal");
const qrClose     = document.getElementById("qr-close");
const qrAddrText  = document.getElementById("qr-address-text");
const qrCopyBtn   = document.getElementById("qr-copy-btn");
const qrContainer = document.getElementById("qr-code-container");

// Address Book
const addContactToggle  = document.getElementById("add-contact-toggle");
const addContactForm    = document.getElementById("add-contact-form");
const contactNameInput  = document.getElementById("contact-name");
const contactAddrInput  = document.getElementById("contact-address");
const saveContactBtn    = document.getElementById("save-contact-btn");
const cancelContactBtn  = document.getElementById("cancel-contact-btn");
const contactsList      = document.getElementById("contacts-list");
const copyAddrBtn       = document.getElementById("copy-addr-btn");
const pickContactBtn    = document.getElementById("pick-contact-btn");
const contactPickerModal = document.getElementById("contact-picker-modal");
const pickerClose       = document.getElementById("picker-close");
const pickerList        = document.getElementById("picker-list");

// Filter tabs
const filterTabs = document.querySelectorAll(".filter-tab");


// ═══════════════════════════════════════════════════════════════════════════
// WALLET: CONNECT
// ═══════════════════════════════════════════════════════════════════════════
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install it from metamask.io");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider    = new ethers.BrowserProvider(window.ethereum);
    signer      = await provider.getSigner();
    userAddress = await signer.getAddress();
    contract    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const network = await provider.getNetwork();
    const short   = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;

    walletAddrElem.innerText   = short;
    shortAddrElem.innerText    = short;
    networkNameElem.innerText  = network.name;

    connectBtn.classList.add("hidden");
    connectedUI.classList.remove("hidden");
    walletDetails.classList.remove("hidden");
    transactionSection.classList.remove("hidden");
    historySection.classList.remove("hidden");
    addressBookSection.classList.remove("hidden");

    await updateBalance();
    await updateHistory();
  } catch (err) {
    console.error("Connect error:", err);
    alert("Could not connect: " + (err.message || err));
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// WALLET: DISCONNECT
// ═══════════════════════════════════════════════════════════════════════════
disconnectBtn.addEventListener("click", () => {
  connectBtn.classList.remove("hidden");
  connectedUI.classList.add("hidden");
  walletDetails.classList.add("hidden");
  transactionSection.classList.add("hidden");
  historySection.classList.add("hidden");
  addressBookSection.classList.add("hidden");

  walletAddrElem.innerText  = "Not connected";
  walletBalElem.innerText   = "0.00";
  networkNameElem.innerText = "Unknown";
  historyBody.innerHTML     = "";
  userAddress = null;
  allTransactions = [];
});


// ═══════════════════════════════════════════════════════════════════════════
// WALLET: BALANCE
// ═══════════════════════════════════════════════════════════════════════════
async function updateBalance() {
  const balance = await provider.getBalance(userAddress);
  walletBalElem.innerText = parseFloat(ethers.formatEther(balance)).toFixed(4);
}


// ═══════════════════════════════════════════════════════════════════════════
// COPY ADDRESS
// ═══════════════════════════════════════════════════════════════════════════
copyAddrBtn.addEventListener("click", () => {
  if (!userAddress) return;
  navigator.clipboard.writeText(userAddress).then(() => {
    const orig = copyAddrBtn.innerHTML;
    copyAddrBtn.innerHTML = `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => { copyAddrBtn.innerHTML = orig; }, 2000);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// SEND TRANSACTION
// ═══════════════════════════════════════════════════════════════════════════
sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value.trim();
  const amount   = document.getElementById("amount").value.trim();

  if (!ethers.isAddress(receiver)) {
    showStatus("Invalid receiver address", "error");
    return;
  }

  try {
    sendBtn.disabled = true;
    sendBtn.innerText = "Sending...";

    statusContainer.classList.remove("hidden");
    showStatus("Pending — confirm in MetaMask...", "pending");

    const tx = await contract.sendTransaction(receiver, {
      value: ethers.parseEther(amount)
    });

    txHashLink.innerText = tx.hash.slice(0, 10) + "...";
    txHashLink.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showStatus("Waiting for confirmation...", "pending");
    await tx.wait();

    showStatus("✓ Transaction confirmed!", "success");
    document.getElementById("receiver").value = "";
    document.getElementById("amount").value   = "";

    await updateBalance();
    await updateHistory();

  } catch (err) {
    console.error("Send error:", err);
    const msg = err?.reason || err?.message || "Transaction failed";
    showStatus("✗ " + msg.slice(0, 80), "error");
  }

  sendBtn.disabled  = false;
  sendBtn.innerText = "Send Transaction";
});

function showStatus(msg, type) {
  statusMessage.innerText  = msg;
  statusMessage.className  = `status ${type}`;
}


// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION HISTORY  (with filter)
// ═══════════════════════════════════════════════════════════════════════════
async function updateHistory() {
  try {
    const txs = await contract.getAllTransactions();
    allTransactions = [...txs].reverse(); // newest first
    renderHistory();
  } catch (err) {
    console.error("History error:", err);
  }
}

function renderHistory() {
  historyBody.innerHTML = "";

  const filtered = allTransactions.filter(tx => {
    const isSent     = tx.sender.toLowerCase()   === userAddress.toLowerCase();
    const isReceived = tx.receiver.toLowerCase() === userAddress.toLowerCase();
    if (activeFilter === "sent")     return isSent;
    if (activeFilter === "received") return isReceived;
    return true; // "all"
  });

  if (filtered.length === 0) {
    historyEmpty.classList.remove("hidden");
    historyEmptyMsg.innerText = activeFilter === "all"
      ? "No transactions found."
      : `No ${activeFilter} transactions.`;
    return;
  }

  historyEmpty.classList.add("hidden");

  filtered.forEach(tx => {
    const isSent = tx.sender.toLowerCase() === userAddress.toLowerCase();
    const type   = isSent ? "sent" : "received";
    const ethAmt = parseFloat(ethers.formatEther(tx.amount)).toFixed(6);
    const time   = new Date(Number(tx.timestamp) * 1000).toLocaleString();

    const senderLabel   = resolveLabel(tx.sender);
    const receiverLabel = resolveLabel(tx.receiver);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="type-badge ${type}">${type === "sent" ? "↑ Sent" : "↓ Received"}</span></td>
      <td class="mono-cell">
        <a class="hash-link" href="https://sepolia.etherscan.io/address/${tx.sender}" target="_blank"
           title="${tx.sender}">${senderLabel}</a>
      </td>
      <td class="mono-cell">
        <a class="hash-link" href="https://sepolia.etherscan.io/address/${tx.receiver}" target="_blank"
           title="${tx.receiver}">${receiverLabel}</a>
      </td>
      <td class="amount-cell ${type}">${isSent ? "−" : "+"}${ethAmt} ETH</td>
      <td class="time-cell">${time}</td>
    `;
    historyBody.appendChild(row);
  });
}

// Resolve address to contact name if available
function resolveLabel(addr) {
  const contacts = getContacts();
  const c = contacts.find(x => x.address.toLowerCase() === addr.toLowerCase());
  const short = addr.slice(0, 6) + "..." + addr.slice(-4);
  return c ? `<span class="contact-name">${c.name}</span> ${short}` : short;
}

// Filter tab click
filterTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    filterTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderHistory();
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// QR CODE  (receive ETH)
// ═══════════════════════════════════════════════════════════════════════════
qrBtn.addEventListener("click", () => {
  if (!userAddress) return;

  qrContainer.innerHTML = "";
  qrAddrText.innerText  = userAddress;

  new QRCode(qrContainer, {
    text:           userAddress,
    width:          200,
    height:         200,
    colorDark:      "#3b82f6",
    colorLight:     "#1e293b",
    correctLevel:   QRCode.CorrectLevel.H
  });

  qrModal.classList.remove("hidden");
});

qrClose.addEventListener("click", () => qrModal.classList.add("hidden"));
qrModal.addEventListener("click", e => { if (e.target === qrModal) qrModal.classList.add("hidden"); });

qrCopyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(userAddress).then(() => {
    qrCopyBtn.innerText = "✓ Copied!";
    setTimeout(() => { qrCopyBtn.innerText = "Copy Address"; }, 2000);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// ADDRESS BOOK  (localStorage)
// ═══════════════════════════════════════════════════════════════════════════
const STORAGE_KEY = "cw_contacts";

function getContacts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveContacts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderContacts() {
  const contacts = getContacts();
  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        <p>No contacts yet. Add one above.</p>
      </div>`;
    return;
  }

  contactsList.innerHTML = contacts.map((c, i) => `
    <div class="contact-item" data-index="${i}">
      <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
      <div class="contact-info">
        <span class="contact-item-name">${c.name}</span>
        <span class="contact-item-addr mono">${c.address.slice(0, 10)}...${c.address.slice(-6)}</span>
      </div>
      <div class="contact-actions">
        <button class="icon-btn small use-contact" data-addr="${c.address}" title="Fill receiver field">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Use
        </button>
        <button class="icon-btn small danger delete-contact" data-index="${i}" title="Delete">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  `).join("");

  // "Use" button fills the receiver input
  contactsList.querySelectorAll(".use-contact").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("receiver").value = btn.dataset.addr;
      transactionSection.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Delete
  contactsList.querySelectorAll(".delete-contact").forEach(btn => {
    btn.addEventListener("click", () => {
      const list = getContacts();
      list.splice(Number(btn.dataset.index), 1);
      saveContacts(list);
      renderContacts();
      renderHistory(); // refresh name labels
    });
  });
}

// Toggle add form
addContactToggle.addEventListener("click", () => {
  addContactForm.classList.toggle("hidden");
  if (!addContactForm.classList.contains("hidden")) contactNameInput.focus();
});
cancelContactBtn.addEventListener("click", () => {
  addContactForm.classList.add("hidden");
  contactNameInput.value  = "";
  contactAddrInput.value  = "";
});

// Save contact
saveContactBtn.addEventListener("click", () => {
  const name = contactNameInput.value.trim();
  const addr = contactAddrInput.value.trim();
  if (!name) { contactNameInput.focus(); return; }
  if (!ethers.isAddress(addr)) {
    contactAddrInput.classList.add("input-error");
    setTimeout(() => contactAddrInput.classList.remove("input-error"), 1500);
    return;
  }

  const list = getContacts();
  if (list.find(c => c.address.toLowerCase() === addr.toLowerCase())) {
    alert("This address is already in your contacts.");
    return;
  }
  list.push({ name, address: addr });
  saveContacts(list);
  renderContacts();
  cancelContactBtn.click();
});

// Pick contact (from send form)
pickContactBtn.addEventListener("click", () => {
  const contacts = getContacts();
  if (!contacts.length) {
    alert("Your address book is empty. Add contacts first.");
    return;
  }
  pickerList.innerHTML = contacts.map((c, i) => `
    <div class="picker-item" data-addr="${c.address}">
      <div class="contact-avatar small">${c.name.charAt(0).toUpperCase()}</div>
      <div class="contact-info">
        <span class="contact-item-name">${c.name}</span>
        <span class="contact-item-addr mono">${c.address.slice(0, 10)}...${c.address.slice(-6)}</span>
      </div>
    </div>
  `).join("");

  pickerList.querySelectorAll(".picker-item").forEach(item => {
    item.addEventListener("click", () => {
      document.getElementById("receiver").value = item.dataset.addr;
      contactPickerModal.classList.add("hidden");
    });
  });

  contactPickerModal.classList.remove("hidden");
});

pickerClose.addEventListener("click", () => contactPickerModal.classList.add("hidden"));
contactPickerModal.addEventListener("click", e => {
  if (e.target === contactPickerModal) contactPickerModal.classList.add("hidden");
});


// ═══════════════════════════════════════════════════════════════════════════
// MetaMask account / chain change listeners
// ═══════════════════════════════════════════════════════════════════════════
window.addEventListener("load", () => {
  renderContacts(); // always load address book from localStorage

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", accs => {
      if (accs.length === 0) disconnectBtn.click();
      else { userAddress = accs[0]; connectWallet(); }
    });
    window.ethereum.on("chainChanged", () => window.location.reload());

    // Auto-reconnect if already approved
    window.ethereum.request({ method: "eth_accounts" }).then(accs => {
      if (accs.length > 0) connectWallet();
    }).catch(() => {});
  }
});

connectBtn.addEventListener("click", connectWallet);
