"use client";
import { baseSepolia } from "viem/chains";
import { createAppKit } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "viem";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("Missing NEXT_PUBLIC_REOWN_PROJECT_ID");
}

const arcChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID);
const arcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL;
const arcExplorerBase = process.env.NEXT_PUBLIC_ARC_EXPLORER_BASE;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!arcChainId) {
  throw new Error("Missing NEXT_PUBLIC_ARC_CHAIN_ID");
}

if (!arcRpcUrl) {
  throw new Error("Missing NEXT_PUBLIC_ARC_RPC_URL");
}

if (!arcExplorerBase) {
  throw new Error("Missing NEXT_PUBLIC_ARC_EXPLORER_BASE");
}

export const arcTestnet = defineChain({
  id: arcChainId,
  caipNetworkId: `eip155:${arcChainId}`,
  chainNamespace: "eip155",
  name: "Arc Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [arcRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: arcExplorerBase,
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 1,
    },
  },
});

export const wagmiNetworks = [arcTestnet, baseSepolia];

export const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  arcTestnet,
  baseSepolia,
];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: wagmiNetworks,
  ssr: true,
  transports: {
    [arcTestnet.id]: http(arcRpcUrl),
    [baseSepolia.id]: http(),
  },
});

export const metadata = {
  name: "Arc PayLink",
  description: "Crypto payment links on Arc Testnet",
  url: appUrl,
  icons: [],
};

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: appKitNetworks,
  metadata,
  defaultNetwork: arcTestnet,
  defaultAccountTypes: { eip155: "eoa" },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});