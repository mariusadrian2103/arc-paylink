// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PayLink {

    struct Payment {
        address creator;
        address recipient;
        uint256 amount;
        string label;
        bool paid;
        address payer;
    }

    uint256 public paymentCount;
    mapping(uint256 => Payment) public payments;

    address public usdc;

    event PaymentCreated(uint256 id, address recipient, uint256 amount, string label);
    event PaymentPaid(uint256 id, address payer);

    constructor(address _usdc) {
        usdc = _usdc;
    }

    function createPayment(
        address recipient,
        uint256 amount,
        string memory label
    ) public returns (uint256) {
        paymentCount++;

        payments[paymentCount] = Payment({
            creator: msg.sender,
            recipient: recipient,
            amount: amount,
            label: label,
            paid: false,
            payer: address(0)
        });

        emit PaymentCreated(paymentCount, recipient, amount, label);

        return paymentCount;
    }

    function pay(uint256 paymentId) public {
        Payment storage p = payments[paymentId];

        require(!p.paid, "Already paid");

        bool success = IERC20(usdc).transferFrom(
            msg.sender,
            p.recipient,
            p.amount
        );

        require(success, "Transfer failed");

        p.paid = true;
        p.payer = msg.sender;

        emit PaymentPaid(paymentId, msg.sender);
    }

    function getPayment(uint256 paymentId) public view returns (Payment memory) {
        return payments[paymentId];
    }
}