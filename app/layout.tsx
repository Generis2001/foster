import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";

// Kindful-style: clean humanist sans for body, DM Sans for headings
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Foster — Decentralized Grant Platform on GenLayer",
  description:
    "Foster enables merit-based funding through AI-assisted subjective consensus on GenLayer StudioNet. Submit proposals, get evaluated by validators, and receive transparent funding.",
  keywords: "GenLayer, grants, decentralized, AI, blockchain, funding",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
