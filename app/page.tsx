"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import {
  PAYLINK_ABI,
  PAYLINK_CONTRACT_ADDRESS,
  ensureArcNetwork,
  getBrowserProvider,
} from "@/lib/paylink";

export default function HomePage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const [origin, setOrigin] = useState("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [createdTxHash, setCreatedTxHash] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const trimmedRecipient = recipient.trim();
  const trimmedAmount = amount.trim();
  const trimmedLabel = label.trim();

  const isValidAddress = useMemo(() => {
    if (!trimmedRecipient) return false;
    return ethers.isAddress(trimmedRecipient);
  }, [trimmedRecipient]);

  const parsedAmountNumber = useMemo(() => {
    const n = Number(trimmedAmount);
    return Number.isFinite(n) ? n : NaN;
  }, [trimmedAmount]);

  const isValidAmount = useMemo(() => {
    return !!trimmedAmount && !Number.isNaN(parsedAmountNumber) && parsedAmountNumber > 0;
  }, [trimmedAmount, parsedAmountNumber]);

  const fullPaymentUrl = useMemo(() => {
    if (!origin || !paymentId) return "";
    return `${origin}/pay?id=${paymentId}`;
  }, [origin, paymentId]);

  async function handleCreatePayment() {
    setErrorMessage("");
    setCopied(false);

    if (!isValidAddress) {
      setErrorMessage("Recipient wallet address is invalid.");
      return;
    }

    if (!isValidAmount) {
      setErrorMessage("Amount must be greater than 0.");
      return;
    }

    try {
      setIsCreating(true);

      await ensureArcNetwork();

      const provider = getBrowserProvider();
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYLINK_CONTRACT_ADDRESS,
        PAYLINK_ABI,
        signer
      );

      // USDC on Arc testnet is ERC-20 with 6 decimals
      const amountInUnits = ethers.parseUnits(trimmedAmount, 6);

      const tx = await contract.createPayment(
        trimmedRecipient,
        amountInUnits,
        trimmedLabel || "Payment request"
      );

      setCreatedTxHash(tx.hash);

      const receipt = await tx.wait();

      let createdId = "";

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "PaymentCreated") {
            createdId = parsed.args.id.toString();
            break;
          }
        } catch {
          // ignore unrelated logs
        }
      }

      if (!createdId) {
        throw new Error("Could not extract payment ID from transaction.");
      }

      setPaymentId(createdId);
    } catch (err: any) {
      const message =
        err?.reason ||
        err?.shortMessage ||
        err?.message ||
        "Failed to create payment request.";
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCopy() {
    if (!fullPaymentUrl) return;
    await navigator.clipboard.writeText(fullPaymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleReset() {
    setRecipient("");
    setAmount("");
    setLabel("");
    setPaymentId("");
    setCreatedTxHash("");
    setCopied(false);
    setErrorMessage("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <style jsx global>{`
        @keyframes floatSlow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @keyframes floatSlowReverse {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(14px);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .float-slow {
          animation: floatSlow 10s ease-in-out infinite;
        }

        .float-slow-reverse {
          animation: floatSlowReverse 12s ease-in-out infinite;
        }

        .pulse-glow {
          animation: pulseGlow 6s ease-in-out infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-100px] h-[340px] w-[340px] rounded-full bg-cyan-500/15 blur-3xl pulse-glow" />
        <div className="absolute right-[-120px] top-[80px] h-[300px] w-[300px] rounded-full bg-blue-500/15 blur-3xl float-slow" />
        <div className="absolute bottom-[-120px] left-[10%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl float-slow-reverse" />
        <div className="absolute bottom-[8%] right-[8%] h-[220px] w-[220px] rounded-full bg-emerald-400/10 blur-3xl pulse-glow" />
      </div>

      <div className="relative z-10 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 text-xl font-black text-[#07111f] shadow-lg">
                P
              </div>
            </div>

            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
              PayLink
            </h1>

            <p className="mt-4 max-w-2xl text-base text-white/65 sm:text-lg">
              Clean crypto payment links for modern wallets. Create a payment request,
              store it on-chain, and share it instantly.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
                  Create payment link
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Generate an on-chain payment request
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Recipient address
                  </label>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-2xl border border-white/10 bg-[#0a1224]/90 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-[#0c162c]"
                  />
                  {recipient && !isValidAddress && (
                    <p className="mt-2 text-sm text-red-300">
                      Please enter a valid wallet address.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Amount
                  </label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-2xl border border-white/10 bg-[#0a1224]/90 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-[#0c162c]"
                  />
                  {amount && !isValidAmount && (
                    <p className="mt-2 text-sm text-red-300">
                      Amount must be greater than 0.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Label <span className="text-white/35">(optional)</span>
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Consulting payment"
                    className="w-full rounded-2xl border border-white/10 bg-[#0a1224]/90 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-[#0c162c]"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleCreatePayment}
                  disabled={isCreating || !isValidAddress || !isValidAmount}
                  className={`rounded-2xl px-5 py-3 font-semibold transition ${
                    isCreating || !isValidAddress || !isValidAmount
                      ? "cursor-not-allowed bg-white/10 text-white/35"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07111f] shadow-[0_10px_30px_rgba(56,189,248,0.25)] hover:scale-[1.02]"
                  }`}
                >
                  {isCreating ? "Creating..." : "Create on-chain link"}
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!fullPaymentUrl}
                  className={`rounded-2xl px-5 py-3 font-semibold transition ${
                    fullPaymentUrl
                      ? "border border-white/15 bg-white/8 text-white hover:bg-white/12"
                      : "cursor-not-allowed bg-white/10 text-white/35"
                  }`}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>

                <button
                  onClick={handleReset}
                  className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-400/15"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
                  Live preview
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Payment summary
                </h2>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#0a1224]/90 p-6 shadow-inner">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-white/45">To</span>
                    <span className="max-w-[70%] break-all text-right font-medium text-white/90">
                      {trimmedRecipient || "—"}
                    </span>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/45">Amount</span>
                    <span className="font-semibold text-white">
                      {trimmedAmount || "0"} USDC
                    </span>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/45">Label</span>
                    <span className="max-w-[70%] text-right font-medium text-white">
                      {trimmedLabel || "—"}
                    </span>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/45">Network</span>
                    <span className="font-medium text-cyan-200">Arc Testnet</span>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/45">Mode</span>
                    <span className="font-medium text-emerald-200">On-chain request</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/8 bg-black/25 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">
                    Payment ID
                  </p>
                  <p className="break-all text-sm text-cyan-300">
                    {paymentId || "Not created yet"}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">
                    Payment link
                  </p>
                  <p className="break-all text-sm text-cyan-300">
                    {fullPaymentUrl || "Create the payment request to get a shareable link."}
                  </p>
                </div>

                {createdTxHash && (
                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 p-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">
                      Create transaction
                    </p>
                    <a
                      href={`https://testnet.arcscan.app/tx/${createdTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm text-emerald-300 hover:underline"
                    >
                      {createdTxHash}
                    </a>
                  </div>
                )}

                {fullPaymentUrl && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-xl">
                      <QRCodeCanvas value={fullPaymentUrl} size={168} />
                    </div>
                    <p className="mt-3 text-center text-sm text-white/45">
                      Scan on mobile to open the on-chain payment page instantly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}