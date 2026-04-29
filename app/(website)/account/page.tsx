import { ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { ProfileEditor } from "@/components/auth/profile-editor";
import { requireSignedIn } from "@/lib/auth/server";
import { getRoleLabel } from "@/lib/auth/shared";

export default async function AccountPage() {
  const user = await requireSignedIn("/account");

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6 bg-surface-container-low p-6 sm:flex-row sm:items-start">
        <div className="flex size-20 shrink-0 items-center justify-center bg-surface-container-highest">
          <span className="font-display text-lg font-bold text-primary">
            {user.initials}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                className="font-display text-xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                {user.displayName}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user.email ?? user.username ?? "Authenticated account"}
              </p>
              <p
                className="mt-1 text-[10px] uppercase text-muted-foreground/50"
                style={{ letterSpacing: "0.1em" }}
              >
                ACCOUNT STATUS ACTIVE
              </p>
            </div>
            <span
              className="inline-flex items-center bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold uppercase text-accent"
              style={{ letterSpacing: "0.12em" }}
            >
              {user.emailVerified ? "EMAIL VERIFIED" : "EMAIL PENDING"}
            </span>
          </div>
        </div>
      </section>

      <section>
        <p
          className="mb-4 font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          ACCOUNT OVERVIEW
        </p>
        <div className="grid gap-px bg-border/10 md:grid-cols-3">
          {[
            {
              icon: UserRound,
              label: "Email verification",
              value: user.emailVerified ? "Verified" : "Pending",
            },
            {
              icon: ShieldCheck,
              label: "MFA status",
              value: user.mfa.enabled ? user.mfa.enabledMethods.join(", ") : "Not enabled",
            },
            {
              icon: WalletCards,
              label: "Role scope",
              value: getRoleLabel(user.role),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-3 bg-surface-container px-5 py-8">
              <Icon className="size-5 text-muted-foreground/50" />
              <span className="font-display text-2xl font-bold text-primary">
                {value}
              </span>
              <span
                className="text-[10px] uppercase text-muted-foreground/60"
                style={{ letterSpacing: "0.1em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 bg-surface-container-low p-6">
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          RECENT ACTIVITY
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          You have not placed any orders yet. When your first order is placed,
          tracking details, shipment updates, and order history will appear here.
        </p>
      </section>

      <section className="bg-surface-container p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-4 shrink-0 text-accent" />
          <div>
            <p
              className="text-[11px] font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.08em" }}
            >
              ACCOUNT SECURITY
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              Review your sign-in settings and verification status anytime from
              the security tab.
            </p>
          </div>
        </div>
      </section>

      <ProfileEditor user={user} />
    </div>
  );
}
