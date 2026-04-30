import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ConfigureAmplify } from "@/components/providers/configure-amplify";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Jackson Firearm Co | Premium Precision",
  description:
    "Federal Firearms Licensee offering premium firearms, parts, and tactical apparel. Est. 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ConfigureAmplify />
        {children}
      </body>
    </html>
  );
}
