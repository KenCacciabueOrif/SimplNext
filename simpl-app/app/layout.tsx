/**
 * Last updated: 2026-04-21
 * Changes: Replaced the starter shell with the Simpl navigation frame used by the feed, thread, and moderation views.
 * Purpose: Provide shared layout metadata and navigation for the Simpl application.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simpl.",
  description: "A local social network rebuilt with Next.js and Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="app-shell">
          <header className="app-header">
            <div>
              <p className="eyebrow">Réseau social local</p>
              <Link href="/" className="brand-link">
                Simpl.
              </Link>
            </div>

            <nav className="app-nav" aria-label="Primary">
              <Link href="/">Fil</Link>
              <Link href="/posts/new">Publier</Link>
              <Link href="/moderation">Modération</Link>
            </nav>
          </header>

          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
