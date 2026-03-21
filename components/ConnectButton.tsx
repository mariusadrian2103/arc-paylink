"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

function shorten(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectButton() {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount({ namespace: "eip155" });

  return (
    <button
      onClick={() =>
        open({
          view: isConnected ? "Account" : "Connect",
          namespace: "eip155",
        })
      }
      className="mt-6 w-full rounded-2xl px-5 py-4 font-semibold transition bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07111f] shadow-[0_10px_30px_rgba(56,189,248,0.25)] hover:scale-[1.01]"
    >
      {isConnected ? `Wallet: ${shorten(address)}` : "Connect Wallet"}
    </button>
  );
}