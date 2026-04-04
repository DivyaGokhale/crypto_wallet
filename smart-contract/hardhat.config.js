require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      //Sepolia RPC URL
      url: "https://eth-sepolia.g.alchemy.com/v2/alchemy_key",

      accounts: ["private key"]
    }
  }
};
