import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraLedger | Decentralized Land Registry on Stellar",
  description: "Transparent, immutable property ownership tokenization powered by Soroban Smart Contracts on Stellar Blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080B11] text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
