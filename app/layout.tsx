import "./globals.css";
import type { Metadata } from "next";
import AppKitProvider from "@/components/AppKitProvider";

export const metadata: Metadata = {
  title: "Arc PayLink",
  description: "Crypto payment links",
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