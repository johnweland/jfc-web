import type { Metadata } from "next";
import { AccountSidebar } from "@/components/layout/account-sidebar";

export const metadata: Metadata = {
  title: "Account | Jackson Firearm Co.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hero strip */}
      <section className="relative topo-bg bg-surface-container py-10 overflow-hidden">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-2"
            style={{ letterSpacing: "0.2em" }}
          >
            OPERATOR PORTAL
          </p>
          <h1
            className="font-display text-3xl font-bold uppercase text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            COMMAND CENTER
          </h1>
        </div>
      </section>

      {/* Two-column body */}
      <div className="bg-surface min-h-[60vh]">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex gap-10 py-10 items-start">
            <AccountSidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
