export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#060818] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm text-cyan-300 hover:underline">← Back to homepage</a>
        <h1 className="mt-6 text-5xl font-black tracking-tight">Zyloo Docs</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          Zyloo lets you create USDC payment links for Base and Solana. Requesters do not need to connect a wallet to create a link.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Create a link</h2>
            <ol className="mt-4 space-y-3 text-white/75">
              <li>1. Choose Base or Solana.</li>
              <li>2. Enter the recipient wallet.</li>
              <li>3. Add the amount in USDC.</li>
              <li>4. Generate and share the payment link.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Payment behavior</h2>
            <ul className="mt-4 space-y-3 text-white/75">
              <li>Base links use the EVM wallet flow already wired in the app.</li>
              <li>Solana links use a Solana Pay style request with QR support.</li>
              <li>USDC is the only token exposed in this MVP.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
