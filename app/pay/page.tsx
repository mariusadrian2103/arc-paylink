"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  ARC_EXPLORER_TX_BASE,
  USDC_ABI,
  USDC_ADDRESS,
  ensureArcNetwork,
  getBrowserProvider,
} from "@/lib/paylink";

type LinkPaymentData = {
  recipient: string;
  amountRaw: string;
  label: string;
};

export default function PayPage() {
  const [payment, setPayment] = useState<LinkPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPayment() {
      try {
        setLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams(window.location.search);

        const to = params.get("to")?.trim() || "";
        const amount = params.get("amount")?.trim() || "";
        const label = params.get("label")?.trim() || "Payment request";

        if (!to) {
          throw new Error("Missing recipient address.");
        }

        if (!ethers.isAddress(to)) {
          throw new Error("Invalid recipient address.");
        }

        const parsedAmount = Number(amount);
        if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          throw new Error("Invalid payment amount.");
        }

        setPayment({
          recipient: to,
          amountRaw: amount,
          label,
        });
      } catch (err: any) {
        const message =
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to load payment.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, []);

  const formattedAmount = useMemo(() => {
    if (!payment) return "0";
    return payment.amountRaw;
  }, [payment]);

  async function handlePay() {
    if (!payment) return;

    try {
      setProcessing(true);
      setStatus("");
      setErrorMessage("");
      setTxHash("");

      await ensureArcNetwork();

      const provider = getBrowserProvider();
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      const decimals: number = await usdc.decimals();
      const amountInUnits = ethers.parseUnits(payment.amountRaw, decimals);

      const allowance: bigint = await usdc.allowance(userAddress, payment.recipient);

      if (allowance < amountInUnits) {
        setStatus("Approving USDC...");
        const approveTx = await usdc.approve(payment.recipient, amountInUnits);
        await approveTx.wait();
      }

      setStatus("Sending payment...");
      const transferTx = await usdc.transfer(payment.recipient, amountInUnits);
      setTxHash(transferTx.hash);
      await transferTx.wait();

      setStatus("Payment successful.");
    } catch (err: any) {
      const message =
        err?.reason ||
        err?.shortMessage ||
        err?.message ||
        "Payment failed.";
      setErrorMessage(message);
      setStatus("");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight">PayLink</h1>
          <p className="mt-3 text-white/60">
            Complete a USDC payment on Arc Testnet.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {loading ? (
            <p className="text-white/70">Loading payment...</p>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
              {errorMessage}
            </div>
          ) : payment ? (
            <>
              <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#0a1224]/90 p-6">
                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Recipient</span>
                  <span className="max-w-[70%] break-all text-right font-medium">
                    {payment.recipient}
                  </span>
                </div>

                <div className="h-px bg-white/8" />

                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Amount</span>
                  <span className="font-semibold">{formattedAmount} USDC</span>
                </div>

                <div className="h-px bg-white/8" />

                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Label</span>
                  <span className="max-w-[70%] text-right font-medium">
                    {payment.label || "—"}
                  </span>
                </div>

                <div className="h-px bg-white/8" />

                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Network</span>
                  <span className="font-medium text-cyan-200">Arc Testnet</span>
                </div>

                <div className="h-px bg-white/8" />

                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Status</span>
                  <span className="font-medium text-amber-300">Ready to pay</span>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={processing}
                className={`mt-6 w-full rounded-2xl px-5 py-4 font-semibold transition ${
                  processing
                    ? "cursor-not-allowed bg-white/10 text-white/35"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07111f] shadow-[0_10px_30px_rgba(56,189,248,0.25)] hover:scale-[1.01]"
                }`}
              >
                {processing ? "Processing..." : `Pay ${formattedAmount} USDC`}
              </button>

              {status && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-100">
                  {status}
                </div>
              )}

              {txHash && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-sm text-white/45">Transaction</p>
                  <a
                    href={`${ARC_EXPLORER_TX_BASE}${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-emerald-300 hover:underline"
                  >
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