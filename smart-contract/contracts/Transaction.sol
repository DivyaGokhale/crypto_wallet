// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Transaction {

    // Structure to store transaction records
    struct TransferRecord {
        address sender;
        address receiver;
        uint256 amount;
        uint256 timestamp;
    }

    // Array to store all transactions
    TransferRecord[] private transactions;

    // Event for frontend/UI tracking
    event Transfer(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Send ETH and record transaction
     * @param receiver Address of recipient
     */
    function sendTransaction(address payable receiver) public payable {

        // Ensure some ETH is sent
        require(msg.value > 0, "Amount must be greater than 0");

        uint256 amount = msg.value;

        // Store transaction
        transactions.push(TransferRecord({
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            timestamp: block.timestamp
        }));

        // Emit event
        emit Transfer(msg.sender, receiver, amount, block.timestamp);

        // Transfer ETH
        (bool success, ) = receiver.call{value: amount}("");
        require(success, "Transaction failed");
    }

    /**
     * @dev Get all transactions
     */
    function getAllTransactions() public view returns (TransferRecord[] memory) {
        return transactions;
    }

    /**
     * @dev Get total transaction count
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}