// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Transaction {
    // Structure to store transaction records
    struct TransferRecord {
        address sender;
        address receiver;
        uint amount;
        uint timestamp;
    }

    // Array to store all saved transaction records
    TransferRecord[] public transactions;

    // Event emitted when a transaction is recorded
    event Transfer(address indexed sender, address indexed receiver, uint amount, uint timestamp);

    /**
     * @dev addTransaction allows users to send ETH and record the transaction.
     * It is marked as `payable` so it can receive and forward ETH in the same transaction.
     * @param receiver The address receiving the ETH
     * @param amount The ETH amount in wei 
     */
    function addTransaction(address payable receiver, uint amount) public payable {
        // If ETH was sent with the transaction call, forward it to the receiver
        if (msg.value > 0) {
            // Require that the explicitly sent ETH value matches the tracked amount
            require(msg.value == amount, "Sent ETH amount does not match msg.value");
            
            // Forward the ETH to the target receiver
            (bool success, ) = receiver.call{value: msg.value}("");
            require(success, "ETH transfer failed");
        }

        // Save the transaction record with current timestamp
        transactions.push(TransferRecord(msg.sender, receiver, amount, block.timestamp));
        
        // Emit the Transfer event
        emit Transfer(msg.sender, receiver, amount, block.timestamp);
    }

    /**
     * @dev Retrieves all recorded transactions
     * @return Array of all TransferRecord structs
     */
    function getAllTransactions() public view returns (TransferRecord[] memory) {
        return transactions;
    }

    /**
     * @dev Get total number of transactions
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}
