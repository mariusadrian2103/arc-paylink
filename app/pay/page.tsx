"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import type { Provider } from "@reown/appkit/react";
import { supabase } from "@/lib/supabase";
import ConnectButton from "@/components/ConnectButton";
import {
  USDC_ABI,
  ensureArcNetworkOnProvider,
  formatErrorMessage,
  isValidEvmAddress,
} from "@/lib/paylink";

type LinkPaymentData = {
  network: string;
  publicId: string;
  recipient: string;
  amountRaw: string;
  label: string;
  status: string;
  txHash: string | null;
};

function shorten(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function explorerUrl(network: string, txHash: string) {
  if (network === "solana") {
    return `https://explorer.solana.com/tx/${txHash}`;
  }
  return `https://basescan.org/tx/${txHash}`;
}

export default function PayPage() {
  const [payment, setPayment] = useState<LinkPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });

  useEffect(() => {
    async function loadPayment() {
      try {
        setLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams(window.location.search);
        const publicId = params.get("id")?.trim() || "";

        if (!publicId) throw new Error("Missing payment link ID.");

        const { data, error } = await supabase
          .from("payment_links")
          .select("*")
          .eq("public_id", publicId)
          .single();

        if (error || !data) throw new Error("Payment link not found.");

        if (data.network === "base" && !isValidEvmAddress(data.recipient_address)) {
          throw new Error("Invalid recipient address.");
        }

        setPayment({
          network: data.network || "base",
          publicId: data.public_id,
          recipient: data.recipient_address,
          amountRaw: data.amount,
          label: data.memo || "Payment request",
          status: data.status || "pending",
          txHash: data.tx_hash || null,
        });

        if (data.tx_hash) setTxHash(data.tx_hash);
      } catch (err: any) {
        setErrorMessage(formatErrorMessage(err, "Failed to load payment."));
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, []);

  const formattedAmount = useMemo(() => payment?.amountRaw || "0", [payment]);
  const isBase = payment?.network === "base";
  const solanaPayUrl = useMemo(() => {
    if (!payment || payment.network !== "solana") return "";
    const mint = process.env.NEXT_PUBLIC_SOLANA_USDC_MINT || "";
    const label = encodeURIComponent("Zyloo");
    const message = encodeURIComponent(payment.label || "USDC payment");
    return `solana:${payment.recipient}?amount=${payment.amountRaw}&spl-token=${mint}&label=${label}&message=${message}`;
  }, [payment]);

  async function handleBasePayment() {
    if (!payment) return;

    if (payment.status === "paid") {
      setErrorMessage("This payment link has already been paid.");
      return;
    }

    if (!isConnected || !address || !walletProvider) {
      setErrorMessage("Please connect an EVM wallet first.");
      return;
    }

    try {
      setProcessing(true);
      setStatus("");
      setErrorMessage("");
      setTxHash("");

      setStatus("Switching network...");
      const baseChainIdHex = ethers.toQuantity(Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || 8453));
      await walletProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: baseChainIdHex }],
      }).catch(async () => {
        await ensureArcNetworkOnProvider(walletProvider);
      });

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const tokenAddress = process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS!;
      const usdc = new Contract(tokenAddress, USDC_ABI, signer);

      setStatus("Checking token decimals...");
      const decimals = Number(await usdc.decimals());
      const amountInUnits = ethers.parseUnits(payment.amountRaw, decimals);

      setStatus("Sending payment...");
      const transferTx = await usdc.transfer(payment.recipient, amountInUnits);
      setTxHash(transferTx.hash);

      setStatus("Waiting for confirmation...");
      await transferTx.wait();

      await supabase
        .from("payment_links")
        .update({
          status: "paid",
          tx_hash: transferTx.hash,
          paid_at: new Date().toISOString(),
        })
        .eq("public_id", payment.publicId);

      setPayment((prev) =>
        prev ? { ...prev, status: "paid", txHash: transferTx.hash } : prev
      );

      setStatus("Payment successful.");
    } catch (err: any) {
      setErrorMessage(formatErrorMessage(err, "Payment failed."));
      setStatus("");
    } finally {
      setProcessing(false);
    }
  }

  async function handleCopySolanaUrl() {
    if (!solanaPayUrl) return;
    await navigator.clipboard.writeText(solanaPayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openSolanaWallet() {
    if (!solanaPayUrl) return;
    window.location.href = solanaPayUrl;
  }

  return (
    <main className="min-h-screen bg-[#060818] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight">Zyloo</h1>
          <p className="mt-3 text-white/60">
            {isBase ? "Complete a USDC payment on Base." : "Complete a USDC payment on Solana."}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {loading ? (
            <p className="text-white/70">Loading payment...</p>
          ) : errorMessage && !payment ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
              {errorMessage}
            </div>
          ) : payment ? (
            <>
              <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#0a1224]/90 p-6">
                <div className="flex justify-between gap-4"><span className="text-white/45">Link ID</span><span className="max-w-[70%] break-all text-right font-medium">{payment.publicId}</span></div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between gap-4"><span className="text-white/45">Recipient</span><span className="max-w-[70%] break-all text-right font-medium">{payment.recipient}</span></div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between gap-4"><span className="text-white/45">Amount</span><span className="font-semibold">{formattedAmount} USDC</span></div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between gap-4"><span className="text-white/45">Label</span><span className="max-w-[70%] text-right font-medium">{payment.label || "—"}</span></div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between gap-4"><span className="text-white/45">Network</span><span className="font-medium text-cyan-200">{isBase ? "Base" : "Solana"}</span></div>
                {isBase && (
                  <>
                    <div className="h-px bg-white/8" />
                    <div className="flex justify-between gap-4"><span className="text-white/45">Wallet</span><span className="font-medium text-white/85">{isConnected ? shorten(address) : "Not connected"}</span></div>
                  </>
                )}
                <div className="h-px bg-white/8" />
                <div className="flex justify-between gap-4"><span className="text-white/45">Status</span><span className={`font-medium ${payment.status === "paid" ? "text-emerald-300" : "text-amber-300"}`}>{payment.status === "paid" ? "Paid" : "Ready to pay"}</span></div>
              </div>

              {isBase ? (
                <>
                  {!isConnected ? (
                    <div className="mt-6"><ConnectButton /></div>
                  ) : (
                    <button
                      onClick={handleBasePayment}
                      disabled={processing || payment.status === "paid"}
                      className={`mt-6 w-full rounded-2xl px-5 py-4 font-semibold transition ${
                        processing || payment.status === "paid"
                          ? "cursor-not-allowed bg-white/10 text-white/35"
                          : "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07111f] shadow-[0_10px_30px_rgba(56,189,248,0.25)] hover:scale-[1.01]"
                      }`}
                    >
                      {payment.status === "paid" ? "Already paid" : processing ? "Processing..." : `Pay ${formattedAmount} USDC`}
                    </button>
                  )}

                  {isConnected && (
                    <button
                      onClick={() => open({ view: "Account" })}
                      className="mt-3 w-full rounded-2xl border border-white/15 bg-white/8 px-5 py-3 font-semibold text-white transition hover:bg-white/12"
                    >
                      Manage wallet
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                    <div className="mx-auto rounded-[24px] border border-white/10 bg-white p-4 shadow-xl">
                      <QRCodeCanvas value={solanaPayUrl || payment.recipient} size={176} />
                    </div>
                    <div>
                      <p className="text-sm text-white/65">
                        Scan this QR code with a Solana wallet that supports Solana Pay, or open the payment request directly.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={openSolanaWallet}
                          className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 font-semibold text-[#07111f]"
                        >
                          Open in Solana wallet
                        </button>
                        <button
                          onClick={handleCopySolanaUrl}
                          className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3 font-semibold text-white"
                        >
                          {copied ? "Copied!" : "Copy Solana Pay URL"}
                        </button>
                      </div>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                        <p className="mb-2 text-white/45">Solana recipient</p>
                        <p className="break-all">{payment.recipient}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
                  {errorMessage}
                </div>
              )}

              {status && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-100">
                  {status}
                </div>
              )}

              {txHash && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-sm text-white/45">Transaction</p>
                  <a href={explorerUrl(payment.network, txHash)} target="_blank" rel="noreferrer" className="break-all text-sm text-emerald-300 hover:underline">
                    {txHash}
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
