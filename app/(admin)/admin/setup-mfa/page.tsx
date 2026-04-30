import { redirect } from "next/navigation";
import { TotpMfaSetupCard } from "@/components/auth/totp-mfa-setup-card";
import { requireAdmin } from "@/lib/auth/server";
import { requiresMfaSetup } from "@/lib/auth/shared";

export default async function AdminSetupMfaPage() {
  const authState = await requireAdmin({
    allowMissingMfa: true,
    redirectTo: "/admin/setup-mfa",
  });

  if (!requiresMfaSetup(authState)) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex max-w-2xl flex-col gap-3">
        <span className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Admin hardening
        </span>
        <h1 className="font-display text-4xl font-bold uppercase text-foreground">
          Finish TOTP setup before entering the admin panel.
        </h1>
        <p className="text-base text-muted-foreground">
          Staff and admin users share the main customer pool, but access under
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">/admin</code>
          requires TOTP MFA.
        </p>
      </section>

      <TotpMfaSetupCard
        buttonLabel="Verify and continue"
        description="Authenticator verification is required before this account can enter the admin panel."
        email={authState.email}
        redirectTo="/admin"
        title="Set Up Admin MFA"
      />
    </div>
  );
}
