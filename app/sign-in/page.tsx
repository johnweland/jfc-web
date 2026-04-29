import { ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/auth/auth-panel";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo =
    typeof params.redirect === "string" ? params.redirect : "/account";

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <section className="flex max-w-xl flex-col gap-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck data-icon="inline-start" />
            <span className="text-sm font-medium uppercase tracking-[0.18em]">
              Cognito Auth Foundation
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold uppercase text-foreground">
            Secure access for customers, staff, and admins.
          </h1>
          <p className="text-base text-muted-foreground">
            Customer accounts stay in a single Cognito User Pool, while staff and
            admin access is elevated through group membership and TOTP-based MFA.
          </p>
        </section>

        <AuthPanel redirectTo={redirectTo} />
      </div>
    </main>
  );
}
