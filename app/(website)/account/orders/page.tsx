import { PackageSearch } from "lucide-react";
import { requireSignedIn } from "@/lib/auth/server";

export default async function OrderHistoryPage() {
  await requireSignedIn("/account/orders");

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
          ORDER HISTORY
        </h2>
      </div>

      <div className="flex flex-col items-center justify-center gap-5 bg-surface-container-low py-24 text-center">
        <PackageSearch className="size-10 text-muted-foreground/20" />
        <div className="max-w-xl">
          <p
            className="mb-1 font-display text-sm font-bold uppercase text-foreground"
            style={{ letterSpacing: "0.04em" }}
          >
            NO ORDERS YET
          </p>
          <p className="text-xs text-muted-foreground">
            When you place an order, your purchases, shipment updates, and order
            details will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
