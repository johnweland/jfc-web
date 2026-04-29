import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | Jackson Firearm Co.",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
