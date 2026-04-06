export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#04050b] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm text-cyan-300 hover:underline">← Back to homepage</a>
        <h1 className="mt-6 text-5xl font-black tracking-tight">Zyloo Docs</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          Zyloo lets you create USDC payment links on Arc Testnet only. Requesters do not need to connect a wallet to create a link.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Create a link</h2>
            <ol className="mt-4 space-y-3 text-white/75">
              <li>1. Enter the recipient wallet.</li>
              <li>2. Add the amount in USDC.</li>
              <li>3. Optionally add a note.</li>
              <li>4. Generate and share the payment link.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Payment behavior</h2>
            <ul className="mt-4 space-y-3 text-white/75">
              <li>Arc Testnet is the only supported network in this build.</li>
              <li>USDC is the only token exposed in this MVP.</li>
              <li>The payer connects an EVM wallet and sends payment on Arc.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
