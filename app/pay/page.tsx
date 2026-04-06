"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit/react";
import { supabase } from "@/lib/supabase";
import ConnectButton from "@/components/ConnectButton";
import {
  USDC_ABI,
  ensureArcNetworkOnProvider,
  formatErrorMessage,
  getExplorerTxUrl,
  isValidEvmAddress,
} from "@/lib/paylink";

type LinkPaymentData = {
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

export default function PayPage() {
  const [payment, setPayment] = useState<LinkPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedRecipient, setCopiedRecipient] = useState(false);

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

        if (!publicId) {
          throw new Error("Missing payment link ID.");
        }

        const { data, error } = await supabase
          .from("payment_links")
          .select("*")
          .eq("public_id", publicId)
          .single();

        if (error || !data) {
          throw new Error("Payment link not found.");
        }

        if (!isValidEvmAddress(data.recipient_address)) {
          throw new Error("Invalid recipient address.");
        }

        setPayment({
          publicId: data.public_id,
          recipient: data.recipient_address,
          amountRaw: data.amount,
          label: data.memo || "Payment request",
          status: data.status || "pending",
          txHash: data.tx_hash || null,
        });

        if (data.tx_hash) {
          setTxHash(data.tx_hash);
        }
      } catch (err: any) {
        setErrorMessage(formatErrorMessage(err, "Failed to load payment."));
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, []);

  const formattedAmount = useMemo(() => payment?.amountRaw || "0", [payment]);
  const statusPill = payment?.status === "paid" ? "Paid" : processing ? "Processing" : "Ready";

  async function handlePayment() {
    if (!payment) return;

    if (payment.status === "paid") {
      setErrorMessage("This payment link has already been paid.");
      return;
    }

    if (!isConnected || !address || !walletProvider) {
      setErrorMessage("Please connect your wallet first.");
      return;
    }

    try {
      setProcessing(true);
      setStatus("Switching to Arc Testnet...");
      setErrorMessage("");
      setTxHash("");

      await ensureArcNetworkOnProvider(walletProvider);

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const tokenAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
      const usdc = new Contract(tokenAddress, USDC_ABI, signer);

      setStatus("Preparing USDC transfer...");
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

  async function handleCopyRecipient() {
    if (!payment?.recipient) return;
    await navigator.clipboard.writeText(payment.recipient);
    setCopiedRecipient(true);
    setTimeout(() => setCopiedRecipient(false), 1400);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.16),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="absolute left-1/2 top-[10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:text-white"
          >
            ← Back to home
          </a>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Complete payment</h1>
          <p className="mt-3 text-white/55">USDC on Arc Testnet.</p>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,25,0.96),rgba(7,10,18,0.92))] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
              Loading payment...
            </div>
          ) : errorMessage && !payment ? (
            <div className="rounded-3xl border border-rose-400/15 bg-rose-400/10 p-6 text-rose-200">
              {errorMessage}
            </div>
          ) : payment ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/45">Link ID</p>
                  <p className="text-lg font-semibold">{payment.publicId}</p>
                </div>
                <div
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    payment.status === "paid"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : processing
                      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {statusPill}
                </div>
              </div>

              {payment.status === "paid" ? (
                <div className="space-y-5">
                  <div className="rounded-[30px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(6,12,20,0.55))] p-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 text-3xl text-emerald-300">
                      ✓
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Payment successful</h2>
                    <p className="mt-2 text-sm text-emerald-100/80">
                      The transfer was confirmed and this payment link is now marked as paid.
                    </p>
                  </div>

                  <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Amount paid</p>
                      <p className="mt-2 text-2xl font-bold">{formattedAmount} USDC</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Network</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-200">Arc Testnet</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Recipient</p>
                        <button
                          onClick={handleCopyRecipient}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
                        >
                          {copiedRecipient ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-2 break-all text-sm font-medium text-white/85">{payment.recipient}</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Label</p>
                      <p className="mt-2 text-sm font-medium text-white/85">{payment.label}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Transaction</p>
                          <p className="mt-2 break-all text-sm text-white/85">{txHash}</p>
                        </div>
                        <a
                          href={getExplorerTxUrl(txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                        >
                          View on ArcScan
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-5 rounded-[28px] border border-cyan-400/12 bg-cyan-400/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Payment summary</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">{formattedAmount} USDC</p>
                    <p className="mt-2 text-sm text-white/55">
                      You are about to send USDC on Arc Testnet.
                    </p>
                  </div>

                  <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Network</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-200">Arc Testnet</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Status</p>
                      <p className="mt-2 text-sm font-bold text-amber-300">Ready to pay</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Recipient</p>
                        <button
                          onClick={handleCopyRecipient}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
                        >
                          {copiedRecipient ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-2 break-all text-sm font-medium text-white/85">{payment.recipient}</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Label</p>
                      <p className="mt-2 text-sm font-medium text-white/85">{payment.label}</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Connected wallet</p>
                      <p className="mt-2 text-sm font-medium text-white/85">
                        {isConnected ? shorten(address) : "Not connected"}
                      </p>
                    </div>
                  </div>

                  {!isConnected ? (
                    <div className="mt-6">
                      <ConnectButton />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handlePayment}
                        disabled={processing}
                        className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-bold transition ${
                          processing
                            ? "cursor-not-allowed bg-white/8 text-white/30"
                            : "bg-[linear-gradient(90deg,#38bdf8,#3b82f6,#4f46e5)] text-white shadow-[0_12px_35px_rgba(59,130,246,0.35)] hover:-translate-y-[1px]"
                        }`}
                      >
                        {processing ? "Processing payment..." : `Pay ${formattedAmount} USDC`}
                      </button>

                      <button
                        onClick={() => open({ view: "Account" })}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                      >
                        Manage wallet
                      </button>
                    </>
                  )}

                  {status && (
                    <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                      {status}
                    </div>
                  )}
                </>
              )}

              {errorMessage && payment.status !== "paid" && (
                <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/10 p-4 text-sm text-rose-200">
                  {errorMessage}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
