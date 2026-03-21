import { ethers } from "ethers";

export const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID);
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL!;
export const ARC_EXPLORER_BASE = process.env.NEXT_PUBLIC_ARC_EXPLORER_BASE!;
export const ARC_EXPLORER_TX_BASE =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_TX_BASE!;

export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

export const ARC_CHAIN_HEX = `0x${ARC_CHAIN_ID.toString(16)}`;

export const USDC_ABI = [
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

export async function ensureArcNetworkOnProvider(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_HEX }],
    });
  } catch (switchError: any) {
    const code = switchError?.code;

    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_CHAIN_HEX,
            chainName: "Arc Testnet",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [ARC_RPC_URL],
            blockExplorerUrls: [ARC_EXPLORER_BASE],
          },
        ],
      });

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_HEX }],
      });

      return;
    }

    throw switchError;
  }
}

export function formatErrorMessage(err: any, fallback: string) {
  return (
    err?.reason ||
    err?.shortMessage ||
    err?.message ||
    fallback
  );
}

export function formatUsdcAmount(amountRaw: string) {
  return amountRaw;
}

export function getExplorerTxUrl(hash: string) {
  return `${ARC_EXPLORER_TX_BASE}${hash}`;
}

export function isValidEvmAddress(address: string) {
  return ethers.isAddress(address);
}