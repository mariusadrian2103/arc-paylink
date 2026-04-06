import "./globals.css";
import type { Metadata } from "next";
import AppKitProvider from "@/components/AppKitProvider";

export const metadata: Metadata = {
  title: "Zyloo",
  description: "USDC payment links on Arc Testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
