import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audit Express — Maturité Agricole",
  description: "Audit de maturité digitale et opérationnelle pour exploitations agricoles TPE/PME",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
