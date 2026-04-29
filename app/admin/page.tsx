import { BadgeCheck, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/server";

export default async function AdminPage() {
  const authState = await requireAdmin({
    redirectTo: "/admin",
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck data-icon="inline-start" />
          <span className="text-sm font-medium uppercase tracking-[0.18em]">
            Protected Admin Surface
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold uppercase text-foreground">
          Admin access is working.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          This page is the starting point for later inventory, imports, exports,
          carts, and order history tooling.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card/95">
          <CardHeader>
            <CardTitle>Current user</CardTitle>
            <CardDescription>
              Server-validated identity from the shared Cognito User Pool.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">
                {authState.email ?? "Unavailable"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium text-foreground">
                {authState.username ?? "Unavailable"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/95">
          <CardHeader>
            <CardTitle>Role and MFA state</CardTitle>
            <CardDescription>
              Group-based elevation stays separate from storefront customer access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {authState.groups.map((group) => (
                <span
                  key={group}
                  className="inline-flex items-center rounded-full border border-border/60 bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground"
                >
                  <BadgeCheck data-icon="inline-start" />
                  {group}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Preferred MFA</span>
              <span className="font-medium text-foreground">
                {authState.mfa.preferredMethod ?? "Not set"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Enabled methods</span>
              <span className="font-medium text-foreground">
                {authState.mfa.enabledMethods.join(", ") || "None"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
