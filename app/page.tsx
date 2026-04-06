"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

function generatePublicId() {
  return crypto.randomUUID().slice(0, 8);
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function HomePage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState("");
  const [publicId, setPublicId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const parsedAmount = useMemo(() => Number(trimmedAmount), [trimmedAmount]);

  const isValidAmount = useMemo(() => {
    return !!trimmedAmount && Number.isFinite(parsedAmount) && parsedAmount > 0;
  }, [trimmedAmount, parsedAmount]);

  const fullPaymentUrl = useMemo(() => {
    if (!origin || !publicId) return "";
    return `${origin}/pay?id=${publicId}`;
  }, [origin, publicId]);

  async function handleCreateLink() {
    setErrorMessage("");
    setSuccessMessage("");
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

      const newPublicId = generatePublicId();

      const { error } = await supabase.from("payment_links").insert([
        {
          public_id: newPublicId,
          recipient_address: trimmedRecipient,
          amount: trimmedAmount,
          token_symbol: "USDC",
          token_address: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
          chain_id: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID),
          network: "arc",
          memo: trimmedLabel || null,
          status: "pending",
        },
      ]);

      if (error) {
        console.error(error);
        setErrorMessage("Failed to save payment link.");
        return;
      }

      setPublicId(newPublicId);
      setSuccessMessage("Payment link created successfully.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to create payment link.");
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
    setPublicId("");
    setCopied(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleDemo() {
    setRecipient("0x1111111111111111111111111111111111111111");
    setAmount("25");
    setLabel("Design payment");
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.10),transparent_34%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-[12%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="absolute bottom-[-80px] left-[-40px] h-[240px] w-[240px] rounded-full bg-indigo-500/20 blur-[90px]" />
        <div className="absolute right-[-50px] top-[22%] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[90px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_28px_rgba(56,189,248,0.16)]">
            <div className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#7dd3fc_0%,#3b82f6_45%,#4f46e5_100%)]" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Zyloo</p>
            <p className="text-xs text-white/45">Arc Testnet · USDC only</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="/docs" className="transition hover:text-white">Docs</a>
          <a href="/pay" className="transition hover:text-white">Pay</a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-16 pt-4 md:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-10">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
            Built only for Arc
          </div>

          <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Payment links
            <br />
            that feel
            <span className="bg-[linear-gradient(90deg,#ffffff,#7dd3fc,#60a5fa)] bg-clip-text text-transparent"> clean</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
            Create a shareable USDC payment request on Arc Testnet in seconds. No network dropdown.
            No extra clutter. Just one recipient, one amount, one clean flow.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleDemo}
              className="rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Load demo
            </button>
            <button
              onClick={handleReset}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-2xl font-bold">Arc only</p>
              <p className="mt-2 text-sm text-white/55">No chain confusion in this build.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-2xl font-bold">USDC</p>
              <p className="mt-2 text-sm text-white/55">Single-token MVP for clean testing.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-2xl font-bold">Fast</p>
              <p className="mt-2 text-sm text-white/55">Create, copy, share, get paid.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[34px] bg-[linear-gradient(135deg,rgba(56,189,248,0.24),rgba(79,70,229,0.20),rgba(255,255,255,0.04))] blur-xl" />
          <div className="relative rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,25,0.96),rgba(7,10,18,0.92))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white/90">Create payment link</p>
                <p className="mt-1 text-xs text-white/45">Arc Testnet · USDC</p>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                ARC
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-white/65">Recipient wallet</span>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0xA3bC9...F5eB2"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/35 focus:bg-white/[0.07]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/65">Amount</span>
                  <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="25"
                      className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/25"
                    />
                    <span className="ml-3 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-200">
                      USDC
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/65">Label</span>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Website work"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/35 focus:bg-white/[0.07]"
                  />
                </label>
              </div>

              {!isValidAddress && recipient && (
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  That wallet address does not look valid.
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              )}

              <button
                onClick={handleCreateLink}
                disabled={isCreating || !isValidAddress || !isValidAmount}
                className={`w-full rounded-2xl py-4 text-sm font-bold transition ${
                  isCreating || !isValidAddress || !isValidAmount
                    ? "cursor-not-allowed bg-white/8 text-white/30"
                    : "bg-[linear-gradient(90deg,#38bdf8,#3b82f6,#4f46e5)] text-white shadow-[0_12px_35px_rgba(59,130,246,0.35)] hover:-translate-y-[1px]"
                }`}
              >
                {isCreating ? "Creating link..." : "Create payment link"}
              </button>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-white/55">Generated link</span>
                  <button
                    onClick={handleCopy}
                    disabled={!fullPaymentUrl}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/70 break-all">
                  {fullPaymentUrl || "Your Arc payment link will appear here."}
                </div>

                {fullPaymentUrl && (
                  <>
                    <div className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Recipient</p>
                        <p className="mt-2 text-sm font-medium text-white/80 break-all">
                          {shortenAddress(trimmedRecipient)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Amount</p>
                        <p className="mt-2 text-sm font-medium text-white/80">{trimmedAmount} USDC</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-3">
                      <div className="rounded-[24px] bg-white p-3 shadow-xl">
                        <QRCodeCanvas value={fullPaymentUrl} size={148} />
                      </div>
                      <p className="text-xs text-white/45">Scan or share this link directly.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
