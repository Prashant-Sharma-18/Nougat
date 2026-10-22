import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/components/UserContext";

export const metadata: Metadata = {
  title: "Nougat Loyalty & Rewards Platform",
  description: "Enterprise Gift Card Loyalty & Point Redemption Platform powered by Tremendous API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-zinc-50 text-zinc-950 antialiased selection:bg-zinc-200 selection:text-zinc-950">
        <UserProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>© 2026 Nougat Loyalty & Rewards</span>
                <span>•</span>
                <Link href="/marketing" className="text-zinc-600 hover:text-zinc-950 underline">
                  Platform Overview
                </Link>
                <span>•</span>
                <Link href="/login" className="text-zinc-600 hover:text-zinc-950 underline">
                  Sign In
                </Link>
                <span>•</span>
                <Link href="/signup" className="text-zinc-600 hover:text-zinc-950 underline">
                  Register
                </Link>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                <span>ACID Atomic Ledger</span>
                <span>•</span>
                <span>Idempotent Settlement</span>
                <span>•</span>
                <span>Automatic Failover</span>
              </div>
            </div>
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
