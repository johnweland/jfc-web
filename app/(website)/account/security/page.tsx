import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
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

      {/* Two-factor authentication */}
      <section className="bg-surface-container-low p-6 flex flex-col gap-4">
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
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p
              className="text-[11px] font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.08em" }}
            >
              STATUS: INACTIVE
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Two-factor authentication is not enabled. Enable 2FA to add an
              extra layer of security to your account.
            </p>
          </div>
        </div>

        <Button
          className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] w-fit gap-2"
          style={{ letterSpacing: "0.12em" }}
        >
          <ShieldCheck className="size-3.5" />
          ENABLE 2FA
        </Button>
      </section>

      <Separator className="bg-border/20" />

      {/* Password */}
      <section className="bg-surface-container-low p-6 flex flex-col gap-4">
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          PASSWORD
        </p>
        <p className="text-xs text-muted-foreground">
          Last changed{" "}
          <span className="text-foreground">March 1, 2025</span>
        </p>
        <Button
          variant="outline"
          className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container text-[10px] w-fit"
          style={{ letterSpacing: "0.1em" }}
        >
          CHANGE PASSWORD
        </Button>
      </section>

      <Separator className="bg-border/20" />

      {/* Encryption status */}
      <section className="bg-surface-container p-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-4 text-accent shrink-0" />
          <div>
            <p
              className="text-[11px] font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.08em" }}
            >
              AES-256 DATA ENCRYPTION: ACTIVE
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              All account data is encrypted at rest and in transit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
