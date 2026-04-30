import { TaxSettingsForm } from "@/components/admin/tax-settings-form"

export default function AdminSettingsPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <p
          className="text-[10px] font-semibold uppercase text-primary mb-1"
          style={{ letterSpacing: "0.2em" }}
        >
          ADMIN / SETTINGS
        </p>
        <h1
          className="font-display text-3xl font-bold uppercase text-foreground"
          style={{ letterSpacing: "-0.03em" }}
        >
          TAX SETTINGS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set the store default tax rate and optional category overrides for storefront totals.
        </p>
      </div>

      <TaxSettingsForm />
    </div>
  )
}
