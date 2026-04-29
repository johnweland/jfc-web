import Link from "next/link";
import { AlertTriangle, Shield, ShieldCheck } from "lucide-react";
import { TotpMfaSetupCard } from "@/components/auth/totp-mfa-setup-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireSignedIn } from "@/lib/auth/server";
import { hasStaffAccess } from "@/lib/auth/shared";

export default async function SecurityPage() {
  const user = await requireSignedIn("/account/security");
  const mfaStatus = user.mfa.enabled
    ? `ACTIVE: ${user.mfa.enabledMethods.join(", ")}`
    : "INACTIVE";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="mb-1 font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          OPERATOR PORTAL
        </p>
        <h2
          className="font-display text-2xl font-bold uppercase text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          SECURITY
        </h2>
      </div>

      <section className="flex flex-col gap-4 bg-surface-container-low p-6">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground/50" />
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary"
            style={{ letterSpacing: "0.18em" }}
          >
            TWO-FACTOR AUTHENTICATION
          </p>
        </div>

        <div className="flex items-start gap-3">
          {user.mfa.enabled ? (
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          )}
          <div>
            <p
              className="text-[11px] font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.08em" }}
            >
              STATUS: {mfaStatus}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {user.mfa.enabled
                ? "This account already has multi-factor authentication configured."
                : "This account does not have multi-factor authentication configured yet."}
            </p>
          </div>
        </div>

        {!user.mfa.enabled && hasStaffAccess(user) ? (
          <Button
            asChild
            className="w-fit gap-2 rounded-none border-0 text-[10px] font-bold uppercase text-primary-foreground gradient-primary"
            style={{ letterSpacing: "0.12em" }}
          >
            <Link href="/admin/setup-mfa">
              <ShieldCheck data-icon="inline-start" />
              Enable admin MFA
            </Link>
          </Button>
        ) : null}
      </section>

      {!user.mfa.enabled ? (
        <TotpMfaSetupCard
          buttonLabel="Enable authenticator app"
          description="Add an authenticator app to help protect your account whenever you sign in."
          email={user.email}
          redirectTo="/account/security"
          title="Add Authenticator App"
        />
      ) : null}

      <Separator className="bg-border/20" />

      <section className="flex flex-col gap-4 bg-surface-container-low p-6">
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          EMAIL VERIFICATION
        </p>
        <p className="text-xs text-muted-foreground">
          Current status{" "}
          <span className="text-foreground">
            {user.emailVerified ? "verified" : "pending verification"}
          </span>
        </p>
      </section>

      <Separator className="bg-border/20" />

      <section className="flex flex-col gap-3 bg-surface-container p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-4 shrink-0 text-accent" />
          <div>
            <p
              className="text-[11px] font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.08em" }}
            >
              ACCOUNT PROTECTION ACTIVE
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              Your current session is active and protected by your account sign-in settings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
