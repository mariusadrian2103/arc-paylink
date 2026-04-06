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
      className="w-full rounded-2xl bg-[linear-gradient(90deg,#38bdf8,#3b82f6,#4f46e5)] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_35px_rgba(59,130,246,0.35)] transition hover:-translate-y-[1px]"
    >
      {isConnected ? `Wallet connected: ${shorten(address)}` : "Connect wallet to continue"}
    </button>
  );
}
