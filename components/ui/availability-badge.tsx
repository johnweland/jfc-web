import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/data/types";

const labels: Record<AvailabilityStatus, string> = {
  in_stock: "IN STOCK",
  low_stock: "LOW STOCK",
  backordered: "BACKORDERED",
  ffl_only: "FFL REQUIRED",
};

const styles: Record<AvailabilityStatus, string> = {
  in_stock: "bg-surface-container-highest text-accent",
  low_stock: "bg-surface-container-highest text-[#decd99]/70",
  backordered: "bg-surface-container-highest text-muted-foreground",
  ffl_only: "bg-surface-container-highest text-accent",
};

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  className?: string;
}

export function AvailabilityBadge({ status, className }: AvailabilityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase",
        styles[status],
        className
      )}
      style={{ letterSpacing: "0.1em" }}
    >
      {labels[status]}
    </span>
  );
}
