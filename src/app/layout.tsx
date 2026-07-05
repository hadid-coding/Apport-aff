import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apport Affaires — Suivi des apports d'affaires",
  description: "Plateforme de suivi des apports d'affaires et des virements",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
