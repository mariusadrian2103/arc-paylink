"use client";

import { createAppKit } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

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
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
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
});

export const networks = [arcTestnet];

export const customRpcUrls = {
  [`eip155:${arcChainId}`]: [{ url: arcRpcUrl }],
};

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
  customRpcUrls,
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
  networks,
  metadata,
  customRpcUrls,
  defaultAccountTypes: { eip155: "eoa" },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});