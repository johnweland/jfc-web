import { InventoryForm } from "@/components/inventory/inventory-form"

export default function NewInventoryPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p
          className="text-[10px] font-semibold uppercase text-primary mb-1"
          style={{ letterSpacing: "0.2em" }}
        >
          ADMIN / INVENTORY / NEW
        </p>
        <h1
          className="font-display text-3xl font-bold uppercase text-foreground"
          style={{ letterSpacing: "-0.03em" }}
        >
          NEW ITEM
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill out the fields below to add an item to inventory.
        </p>
      </div>

      <InventoryForm />
    </div>
  )
}
