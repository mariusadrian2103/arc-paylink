// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayLink.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        new PayLink(0x3600000000000000000000000000000000000000);

        vm.stopBroadcast();
    }
}