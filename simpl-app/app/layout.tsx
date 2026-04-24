/**
 * Last updated: 2026-04-22
 * Changes: Added a global geolocation manager bootstrap to request permissions and keep viewer location synchronized during app usage.
 * Purpose: Provide shared layout metadata and navigation for the Simpl application.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppTabs from "@/app/components/AppTabs";
import GeoLocationManager from "@/app/components/GeoLocationManager";
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
  description: "A local social network rebuilt with a UI close to the original Simpl prototype.",
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
        <GeoLocationManager />
        <div className="app-shell">
          <header className="title-bar">
            <h1>Simpl.</h1>
          </header>

          <AppTabs />

          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
