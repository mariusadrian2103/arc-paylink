"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

function generatePublicId() {
  return crypto.randomUUID().slice(0, 8);
}

export default function HomePage() {
  const [network, setNetwork] = useState("base");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [publicId, setPublicId] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [linkReady, setLinkReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
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

  const isValidAmount = useMemo(
    () => !!trimmedAmount && !Number.isNaN(parsedAmountNumber) && parsedAmountNumber > 0,
    [trimmedAmount, parsedAmountNumber]
  );

  const fullPaymentUrl = useMemo(() => {
    if (!origin || !linkReady || !publicId) return "";
    return `${origin}/pay?id=${publicId}`;
  }, [origin, linkReady, publicId]);

  const displayLink = fullPaymentUrl
    ? "zyloo.io/p/" + publicId
    : "zyloo.io/p/8dj3k2";

  async function handleCreatePayment() {
    setErrorMessage("");
    setCopied(false);
    if (!isValidAddress) { setErrorMessage("Recipient wallet address is invalid."); return; }
    if (!isValidAmount) { setErrorMessage("Amount must be greater than 0."); return; }
    try {
      setIsCreating(true);
      const newPublicId = generatePublicId();
      const isBase = network === "base";
      const { error } = await supabase.from("payment_links").insert([{
        public_id: newPublicId,
        recipient_address: trimmedRecipient,
        amount: trimmedAmount,
        token_symbol: "USDC",
        token_address: isBase ? process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS! : process.env.NEXT_PUBLIC_USDC_ADDRESS!,
        chain_id: isBase ? Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || 84532) : Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID!),
        network,
        memo: trimmedLabel || null,
        status: "pending",
      }]);
      if (error) { console.error("Supabase error:", error); setErrorMessage("Failed to save payment link."); return; }
      setPublicId(newPublicId);
      setLinkReady(true);
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
    setRecipient(""); setAmount(""); setLabel(""); setPublicId("");
    setCopied(false); setErrorMessage(""); setIsCreating(false); setLinkReady(false);
  }

  return (
    <div className="min-h-screen bg-[#060818] text-white relative overflow-hidden">

      {/* ── Background ── */}
      {/* Mesh overlay */}
      <div className="absolute inset-0 opacity-[0.12] mix-blend-screen">
      <img
      src="/bg-mesh.png"
      alt=""
      className="w-full h-full object-cover"
      />
      </div>
      <div className="pointer-events-none absolute inset-0">
        {/* Radial colour glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_75%_0%,rgba(110,50,210,0.38),transparent),radial-gradient(ellipse_50%_60%_at_10%_55%,rgba(25,70,190,0.22),transparent),radial-gradient(ellipse_40%_40%_at_50%_100%,rgba(60,40,180,0.18),transparent)]" />

        {/* Stars layer 1 */}
        <div className="absolute inset-0 opacity-65 [background-image:radial-gradient(circle_at_7%_10%,#fff_0,#fff_1px,transparent_1.5px),radial-gradient(circle_at_19%_66%,#fff_0,#fff_1px,transparent_1.5px),radial-gradient(circle_at_31%_25%,rgba(255,255,255,.85)_0,rgba(255,255,255,.85)_1px,transparent_1.5px),radial-gradient(circle_at_44%_50%,rgba(255,255,255,.75)_0,rgba(255,255,255,.75)_1px,transparent_1.5px),radial-gradient(circle_at_58%_12%,#fff_0,#fff_1px,transparent_1.5px),radial-gradient(circle_at_70%_40%,rgba(255,255,255,.88)_0,rgba(255,255,255,.88)_1px,transparent_1.5px),radial-gradient(circle_at_83%_20%,#fff_0,#fff_1px,transparent_1.5px),radial-gradient(circle_at_90%_70%,rgba(255,255,255,.72)_0,rgba(255,255,255,.72)_1px,transparent_1.5px),radial-gradient(circle_at_15%_82%,rgba(255,255,255,.88)_0,rgba(255,255,255,.88)_1px,transparent_1.5px),radial-gradient(circle_at_52%_80%,rgba(255,255,255,.82)_0,rgba(255,255,255,.82)_1px,transparent_1.5px),radial-gradient(circle_at_2%_42%,rgba(255,255,255,.68)_0,rgba(255,255,255,.68)_1px,transparent_1.5px),radial-gradient(circle_at_38%_90%,rgba(255,255,255,.78)_0,rgba(255,255,255,.78)_1px,transparent_1.5px),radial-gradient(circle_at_64%_92%,rgba(255,255,255,.65)_0,rgba(255,255,255,.65)_1px,transparent_1.5px),radial-gradient(circle_at_76%_88%,rgba(255,255,255,.72)_0,rgba(255,255,255,.72)_1px,transparent_1.5px),radial-gradient(circle_at_95%_48%,rgba(255,255,255,.8)_0,rgba(255,255,255,.8)_1px,transparent_1.5px)]" />

        {/* Stars layer 2 */}
        <div className="absolute inset-0 opacity-40 [background-size:600px_600px] [background-image:radial-gradient(circle_at_15%_20%,rgba(255,255,255,.9)_0,rgba(255,255,255,.9)_1px,transparent_1.8px),radial-gradient(circle_at_65%_55%,rgba(255,255,255,.9)_0,rgba(255,255,255,.9)_1px,transparent_1.8px),radial-gradient(circle_at_80%_15%,rgba(255,255,255,.85)_0,rgba(255,255,255,.85)_1px,transparent_1.8px),radial-gradient(circle_at_30%_78%,rgba(255,255,255,.75)_0,rgba(255,255,255,.75)_1px,transparent_1.8px)]" />

        {/* Light streaks / waves */}
        <div className="absolute left-[-6%] top-[34%] h-[160px] w-[72%] -rotate-[7deg] rounded-full border border-cyan-300/10 bg-[linear-gradient(90deg,transparent_0%,rgba(70,170,255,0.16)_35%,rgba(100,60,220,0.10)_65%,transparent_100%)] blur-[2px]" />
        <div className="absolute left-[-10%] top-[48%] h-[140px] w-[66%] -rotate-[5deg] rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(50,110,255,0.11)_40%,rgba(90,50,200,0.07)_70%,transparent_100%)] blur-[1px]" />
        <div className="absolute bottom-[10%] right-[-4%] h-[180px] w-[52%] rotate-[7deg] rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(180,60,200,0.13)_40%,rgba(110,50,255,0.08)_70%,transparent_100%)] blur-[2px]" />

        {/* Bottom floor glow */}
        <div className="absolute inset-x-0 bottom-0 h-[220px] bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(60,40,200,0.22),transparent)]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.07]">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_130deg_at_50%_50%,#1a5fff,#8b3fff,#1a5fff)] opacity-90" />
            {/* Inner sphere */}
            <div className="absolute inset-[2.5px] rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(130,200,255,0.9)_0%,rgba(45,100,220,0.75)_48%,rgba(55,20,130,0.85)_100%)]" />
            {/* Globe lines */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5px]">
              <div className="h-px w-[65%] bg-white/25" />
              <div className="h-px w-[65%] bg-white/20" />
            </div>
          </div>
          <span className="text-[20px] font-semibold tracking-tight">Zyloo</span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-10 text-[15px] text-white/60">
          <a href="#" className="hover:text-white transition">Docs</a>
          <a href="#" className="hover:text-white transition">Login</a>
        </nav>

        {/* CTA */}
        <a
          href="#create"
          className="rounded-full bg-[#2563eb] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_18px_rgba(37,99,235,0.45)] hover:bg-[#1d52d0] transition"
        >
          Create Link
        </a>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pt-20 pb-14 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-start">

        {/* Left: copy */}
        <div className="pt-4 lg:pt-10">
          <h1 className="text-[62px] sm:text-[72px] lg:text-[78px] font-black leading-[1.01] tracking-[-0.04em] text-white">
            Get paid with<br />a simple link.
          </h1>
          <p className="mt-6 text-[16px] leading-[1.7] text-white/52">
            Create crypto payment links in seconds.<br />
            No wallet needed to request. Instant settlement.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#create"
              className="rounded-[14px] bg-[#2563eb] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(37,99,235,0.38)] hover:-translate-y-[1px] transition"
            >
              Create Payment Link
            </a>
            <button className="rounded-[14px] border border-white/12 bg-white/[0.06] px-8 py-4 text-[15px] font-medium text-white/82 hover:bg-white/[0.10] transition">
              View Demo
            </button>
          </div>
        </div>

        {/* Right: Create Payment card */}
        <div id="create" className="mx-auto w-full max-w-[440px]">
          <div className="rounded-[22px] border border-white/10 bg-[rgba(9,15,30,0.92)] shadow-[0_22px_70px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl">
            <div className="p-6">

              {/* Card header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-white">Create Payment</h2>
                <button onClick={handleReset} className="text-white/35 hover:text-white/65 transition text-[26px] leading-none -mt-1">×</button>
              </div>

              {/* Fields */}
              <div className="space-y-[10px]">

                {/* Amount */}
                <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.038] px-4 py-3">
                  <span className="text-[13px] text-white/55">Amount</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50"
                      className="w-14 bg-transparent text-right text-[17px] font-semibold text-white outline-none placeholder:text-white/28"
                    />
                    <div className="flex items-center gap-1.5 rounded-[9px] border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-white/88">
                      USDC&nbsp;<span className="text-white/38 text-[9px]">▾</span>
                    </div>
                  </div>
                </div>

                {/* Network */}
                <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.038] px-4 py-3">
                  <span className="text-[13px] text-white/55">Network</span>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
                    <div className="relative flex items-center">
                      <select
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        className="appearance-none bg-transparent text-[13px] font-medium text-white outline-none pr-4 cursor-pointer"
                      >
                        <option value="base">Base</option>
                        <option value="arc">Arc Testnet</option>
                      </select>
                      <span className="pointer-events-none absolute right-0 text-white/38 text-[9px]">▾</span>
                    </div>
                  </div>
                </div>

                {/* Wallet */}
                <div className="flex items-center rounded-[14px] border border-white/10 bg-white/[0.038] px-4 py-3">
                  <span className="text-[13px] text-white/55 shrink-0">Wallet</span>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0xA3bC9...F5eB2"
                    className="ml-3 flex-1 bg-transparent text-right text-[12px] font-medium text-white outline-none placeholder:text-white/28 min-w-0"
                  />
                  <span className="ml-2 text-white/38 shrink-0 text-[15px]">≡</span>
                </div>

                {recipient && !isValidAddress && (
                  <p className="text-[11px] text-red-300 px-1">Invalid wallet address.</p>
                )}

                {/* Note */}
                <div className="flex items-center rounded-[14px] border border-white/10 bg-white/[0.038] px-4 py-3">
                  <span className="text-[13px] text-white/55 shrink-0">Note</span>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Freelance Work"
                    className="ml-3 flex-1 bg-transparent text-right text-[12px] font-medium text-white outline-none placeholder:text-white/28"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="mt-3 rounded-[12px] border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
                  {errorMessage}
                </div>
              )}

              {/* Generate Link button */}
              <button
                onClick={handleCreatePayment}
                disabled={isCreating || !isValidAddress || !isValidAmount}
                className={`mt-4 w-full rounded-[14px] py-3.5 text-[14px] font-semibold transition ${
                  isCreating || !isValidAddress || !isValidAmount
                    ? "bg-white/8 text-white/28 cursor-not-allowed"
                    : "bg-[linear-gradient(90deg,#2364eb,#4285f5)] text-white shadow-[0_6px_20px_rgba(37,99,235,0.42)] hover:-translate-y-[1px]"
                }`}
              >
                {isCreating ? "Generating..." : "Generate Link"}
              </button>

              {/* Your Link */}
              <div className="mt-3.5 overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.025]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-white/50">Your Link:</span>
                  <button
                    onClick={handleCopy}
                    disabled={!fullPaymentUrl}
                    className="rounded-[8px] border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/78 hover:bg-white/[0.10] transition disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <div className="border-t border-white/[0.07] px-4 py-3 text-[13px] text-white/68">
                  {displayLink}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Features bar ── */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pb-8">
        <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.028] px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[14px] text-white/78">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-[20px] text-yellow-300">⚡</span>
              <span>Instant Payments</span>
            </div>
            <div className="flex items-center justify-center gap-3 border-white/[0.08] md:border-x px-4">
              <span className="text-[20px]">🔗</span>
              <span>Link-Based Simplicity</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3">
              {/* Multi-chain stack icon */}
              <div className="flex flex-col gap-[3px]">
                <div className="h-[5px] w-[20px] rounded-full bg-blue-400" />
                <div className="h-[5px] w-[20px] rounded-full bg-teal-400" />
                <div className="h-[5px] w-[20px] rounded-full bg-purple-400" />
              </div>
              <span>Multi-Chain: Base · Solana · More</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pt-8 pb-14">
        <h2 className="mb-10 text-center text-[30px] font-bold tracking-[-0.02em] text-white">
          How It Works
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[14px]">
          {(["Enter amount & wallet", "Generate your link", "Get paid instantly"] as const).map(
            (step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.055] text-[14px] font-semibold text-white">
                    {i + 1}
                  </div>
                  <span className="text-white/75 whitespace-nowrap">{step}</span>
                </div>
                {i < 2 && (
                  <span className="text-white/25 text-[22px] leading-none">›</span>
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Personal Payment Page ── */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pb-20 text-center">
        <h2 className="text-[30px] font-bold tracking-[-0.02em] text-white mb-8">
          Your <span className="font-black">Personal</span> Payment Page
        </h2>

        <div className="mx-auto max-w-[480px]">
          <div className="rounded-full p-[1.5px] bg-[linear-gradient(90deg,rgba(38,78,200,0.85),rgba(70,130,255,0.9),rgba(90,200,255,0.85))] shadow-[0_12px_40px_rgba(55,100,255,0.30)]">
            <div className="flex items-center justify-between rounded-full bg-[linear-gradient(180deg,rgba(28,50,155,0.90),rgba(22,40,128,0.84))] px-7 py-4">
              <span className="text-[19px] font-semibold text-white">zyloo.io/marius</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white/90 text-[18px] leading-none">
                ›
              </div>
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-10">
          <p className="text-[12px] uppercase tracking-widest text-white/38 mb-5">Powered by</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {/* BASE */}
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="11" fill="#0052FF" />
                <path d="M11 5.5C8 5.5 5.5 8 5.5 11C5.5 14 8 16.5 11 16.5C14 16.5 16.5 14 16.5 11C16.5 8 14 5.5 11 5.5ZM11 14.5C9.07 14.5 7.5 12.93 7.5 11C7.5 9.07 9.07 7.5 11 7.5C12.93 7.5 14.5 9.07 14.5 11C14.5 12.93 12.93 14.5 11 14.5Z" fill="white" />
              </svg>
              <span className="text-[14px] font-bold text-white/80 tracking-[0.08em]">BASE</span>
            </div>
            {/* SOLANA */}
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <defs>
                  <linearGradient id="sol" x1="0" y1="0" x2="22" y2="22">
                    <stop offset="0%" stopColor="#9945FF" />
                    <stop offset="100%" stopColor="#14F195" />
                  </linearGradient>
                </defs>
                <rect width="22" height="22" rx="4" fill="url(#sol)" />
                <path d="M5 14.5L8 11.5H17M5 7.5H14L17 10.5H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[14px] font-bold text-white/80 tracking-[0.08em]">SOLANA</span>
            </div>
          </div>
          {/* CIRCLE */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="#4CAF8A" strokeWidth="1.8" />
              <circle cx="11" cy="11" r="5" stroke="#4CAF8A" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="1.5" fill="#4CAF8A" />
            </svg>
            <span className="text-[14px] font-bold text-white/80 tracking-[0.12em]">CIRCLE</span>
          </div>
        </div>

        {/* QR code (only when link is generated) */}
        {fullPaymentUrl && (
          <div className="mt-10 flex justify-center">
            <div className="rounded-[22px] border border-white/10 bg-white p-4 shadow-xl">
              <QRCodeCanvas value={fullPaymentUrl} size={160} />
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
