import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITCM GLOBAL AI | Executive Command Center",
  description: "Secure AI-powered business operations command center."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
