import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import { NotificationProvider } from "@/lib/NotificationContext";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Foster — Decentralized Grant Platform on GenLayer",
  description:
    "Foster enables merit-based funding through AI-assisted subjective consensus on GenLayer StudioNet. Submit proposals, get evaluated by validators, and receive transparent funding.",
  keywords: "GenLayer, grants, decentralized, AI, blockchain, funding",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <NotificationProvider><WalletProvider>{children}</WalletProvider></NotificationProvider>
      </body>
    </html>
  );
}
