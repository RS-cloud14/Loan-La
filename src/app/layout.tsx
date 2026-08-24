import type { Metadata } from "next";
import "@fontsource/inter"; // Premium default font
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Loan - La | Smart Loan Matcher",
  description: "Pre-check bank loan eligibility for gig workers, freelancers, and small businesses in Malaysia. Fast cashflow analysis, DSR calculation, and licensed bank matching.",
  icons: {
    icon: "/logo/logo.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
