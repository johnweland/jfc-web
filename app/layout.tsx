import type { Metadata } from "next";
import { ConfigureAmplify } from "@/components/providers/configure-amplify";
import { amplifyOutputs } from "@/lib/auth/amplify-server";
import "./globals.css";

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
        className="antialiased min-h-screen flex flex-col"
      >
        <ConfigureAmplify outputs={amplifyOutputs} />
        {children}
      </body>
    </html>
  );
}
