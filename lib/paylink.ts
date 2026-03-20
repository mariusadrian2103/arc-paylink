import { ethers } from "ethers";

export const ARC_CHAIN_ID_DEC = 5042002;
export const ARC_CHAIN_ID_HEX = "0x4cef52";

export const ARC_NETWORK_PARAMS = {
  chainId: ARC_CHAIN_ID_HEX,
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

export const ARC_EXPLORER_TX_BASE = "https://testnet.arcscan.app/tx/";
export const ARC_EXPLORER_ADDRESS_BASE = "https://testnet.arcscan.app/address/";

export const PAYLINK_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_PAYLINK_CONTRACT!;

export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

export const PAYLINK_ABI = [
  "function createPayment(address recipient, uint256 amount, string label) returns (uint256)",
  "function getPayment(uint256 paymentId) view returns (tuple(address creator,address recipient,uint256 amount,string label,bool paid,address payer))",
  "function pay(uint256 paymentId)",
  "function paymentCount() view returns (uint256)",
  "function usdc() view returns (address)",
  "event PaymentCreated(uint256 id, address recipient, uint256 amount, string label)",
  "event PaymentPaid(uint256 id, address payer)",
] as const;

export const USDC_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

export async function ensureArcNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  const currentChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (currentChainId?.toLowerCase() === ARC_CHAIN_ID_HEX.toLowerCase()) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    if (switchError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ARC_NETWORK_PARAMS],
      });

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_ID_HEX }],
      });
    } else {
      throw switchError;
    }
  }
}

export function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  return new ethers.BrowserProvider(window.ethereum);
}