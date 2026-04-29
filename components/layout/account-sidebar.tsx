"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Heart, MapPin, Shield } from "lucide-react";

const navItems = [
  { label: "PROFILE",       href: "/account",            icon: User },
  { label: "ORDER HISTORY", href: "/account/orders",     icon: Package },
  { label: "SAVED ITEMS",   href: "/account/favorites",  icon: Heart },
  { label: "ADDRESSES",     href: "/account/addresses",  icon: MapPin },
  { label: "SECURITY",      href: "/account/security",   icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-52 shrink-0 flex-col gap-1 sticky top-20">
      <p
        className="px-3 pb-2 text-[10px] font-semibold uppercase text-muted-foreground/50"
        style={{ letterSpacing: "0.18em" }}
      >
        COMMAND CENTER
      </p>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(href);

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
    </aside>
  );
}
