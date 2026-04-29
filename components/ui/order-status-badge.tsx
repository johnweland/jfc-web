import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/data/orders";

const labels: Record<OrderStatus, string> = {
  processing: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

const styles: Record<OrderStatus, string> = {
  processing: "bg-surface-container-highest text-[#decd99]/70",
  shipped: "bg-surface-container-highest text-accent",
  delivered: "bg-surface-container-highest text-accent",
  cancelled: "bg-surface-container-highest text-destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
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
