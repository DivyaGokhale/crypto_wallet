const hre = require("hardhat");

async function main() {
  const Transaction = await hre.ethers.getContractFactory("Transaction");
  const transaction = await Transaction.deploy();

  await transaction.waitForDeployment();

  console.log("Transaction contract deployed to:", await transaction.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
