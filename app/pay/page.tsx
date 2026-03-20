"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  ARC_EXPLORER_TX_BASE,
  PAYLINK_ABI,
  PAYLINK_CONTRACT_ADDRESS,
  USDC_ABI,
  USDC_ADDRESS,
  ensureArcNetwork,
  getBrowserProvider,
} from "@/lib/paylink";

type PaymentData = {
  creator: string;
  recipient: string;
  amount: bigint;
  label: string;
  paid: boolean;
  payer: string;
};

export default function PayPage() {
  const [paymentId, setPaymentId] = useState("");
  const [payment, setPayment] = useState<PaymentData | null>(null);
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
        const id = params.get("id")?.trim() || "";

        if (!id) {
          throw new Error("Missing payment id.");
        }

        setPaymentId(id);

        await ensureArcNetwork();

        const provider = getBrowserProvider();
        const contract = new ethers.Contract(
          PAYLINK_CONTRACT_ADDRESS,
          PAYLINK_ABI,
          provider
        );

        const result = await contract.getPayment(id);

        const loadedPayment: PaymentData = {
          creator: result.creator,
          recipient: result.recipient,
          amount: result.amount,
          label: result.label,
          paid: result.paid,
          payer: result.payer,
        };

        if (loadedPayment.recipient === ethers.ZeroAddress) {
          throw new Error("Payment request not found.");
        }

        setPayment(loadedPayment);
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
    return ethers.formatUnits(payment.amount, 6);
  }, [payment]);

  async function handlePay() {
    if (!payment || !paymentId) return;

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
      const paylink = new ethers.Contract(
        PAYLINK_CONTRACT_ADDRESS,
        PAYLINK_ABI,
        signer
      );

      const allowance: bigint = await usdc.allowance(
        userAddress,
        PAYLINK_CONTRACT_ADDRESS
      );

      if (allowance < payment.amount) {
        setStatus("Approving USDC...");
        const approveTx = await usdc.approve(
          PAYLINK_CONTRACT_ADDRESS,
          payment.amount
        );
        await approveTx.wait();
      }

      setStatus("Sending payment...");
      const payTx = await paylink.pay(paymentId);
      setTxHash(payTx.hash);
      await payTx.wait();

      setStatus("Payment successful.");

      const refreshed = await paylink.getPayment(paymentId);
      setPayment({
        creator: refreshed.creator,
        recipient: refreshed.recipient,
        amount: refreshed.amount,
        label: refreshed.label,
        paid: refreshed.paid,
        payer: refreshed.payer,
      });
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
            Complete an on-chain USDC payment on Arc Testnet.
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
                  <span className="text-white/45">Payment ID</span>
                  <span className="font-medium text-cyan-300">{paymentId}</span>
                </div>

                <div className="h-px bg-white/8" />

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
                  <span className="text-white/45">Status</span>
                  <span
                    className={`font-medium ${
                      payment.paid ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {payment.paid ? "Paid" : "Pending"}
                  </span>
                </div>

                {payment.paid && (
                  <>
                    <div className="h-px bg-white/8" />
                    <div className="flex justify-between gap-4">
                      <span className="text-white/45">Paid by</span>
                      <span className="max-w-[70%] break-all text-right font-medium">
                        {payment.payer}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!payment.paid && (
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
              )}

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