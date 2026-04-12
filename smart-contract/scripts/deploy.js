const hre = require("hardhat");

async function main() {
  const Transactions = await hre.ethers.getContractFactory("Transaction");
  const contract = await Transactions.deploy();

  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);