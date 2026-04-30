"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Upload,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "DASHBOARD", href: "/admin", icon: LayoutDashboard },
  { label: "INVENTORY", href: "/admin/inventory", icon: Package },
  { label: "ORDERS", href: "/admin/orders", icon: ShoppingCart },
  { label: "CUSTOMERS", href: "/admin/customers", icon: Users },
  { label: "IMPORT/EXPORT", href: "/admin/import", icon: Upload },
  { label: "SETTINGS", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      <p
        className="px-3 pb-3 text-[10px] font-semibold uppercase text-muted-foreground/50"
        style={{ letterSpacing: "0.18em" }}
      >
        COMMAND CENTER
      </p>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-semibold uppercase transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
            }`}
            style={{ letterSpacing: "0.1em" }}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
