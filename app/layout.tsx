import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakBetter",
  description: "Simple English speaking practice for international students"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
