import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Konfigurator Wiat 3D | Wizualizator",
  description: "Interaktywny konfigurator wiat stalowych 3D - wybierz rozmiar, kolor, panele i dach dla swojej wiaty.",
  keywords: "wiata, carport, konfigurator, 3D, wizualizacja, wiata stalowa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
