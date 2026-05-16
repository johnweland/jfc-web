"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, Shield, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AccountUserState } from "@/lib/auth/shared";

const navItems = [
  { label: "PROFILE",       href: "/account",            icon: User },
  { label: "ORDER HISTORY", href: "/account/orders",     icon: Package },
  { label: "SAVED ITEMS",   href: "/account/favorites",  icon: Heart },
  { label: "ADDRESSES",     href: "/account/addresses",  icon: MapPin },
  { label: "SECURITY",      href: "/account/security",   icon: Shield },
];

export function AccountSidebar({ user }: { user: AccountUserState }) {
  const pathname = usePathname();

  const renderNavLink = ({
    label,
    href,
    icon: Icon,
    compact = false,
  }: (typeof navItems)[number] & { compact?: boolean }) => {
    const isActive =
      href === "/account"
        ? pathname === "/account"
        : pathname.startsWith(href);

    return (
      <Link
        key={href}
        href={href}
        className={
          compact
            ? `flex min-h-12 items-center gap-3 px-3 py-2.5 text-[11px] font-semibold uppercase transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
              }`
            : `flex items-center gap-3 px-3 py-2.5 text-[11px] font-semibold uppercase transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
              }`
        }
        style={{ letterSpacing: "0.1em" }}
      >
        <Icon className="size-3.5 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="flex w-full flex-col gap-4 lg:hidden">
        <div className="flex w-full flex-col gap-3 bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center bg-surface-container-highest">
              <span className="font-display text-sm font-bold text-primary">
                {user.initials}
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="truncate font-display text-xs font-semibold uppercase text-foreground"
                style={{ letterSpacing: "0.06em" }}
              >
                {user.displayName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user.email ?? user.username ?? "Authenticated"}
              </p>
            </div>
          </div>
          <SignOutButton
            className="w-full rounded-none text-[10px] font-bold uppercase"
            variant="outline"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {navItems.map((item) => renderNavLink({ ...item, compact: true }))}
        </div>
      </div>

      <aside className="hidden w-52 shrink-0 flex-col gap-1 lg:sticky lg:top-20 lg:flex">
        <div className="mb-4 flex flex-col gap-3 bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center bg-surface-container-highest">
              <span className="font-display text-sm font-bold text-primary">
                {user.initials}
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="truncate font-display text-xs font-semibold uppercase text-foreground"
                style={{ letterSpacing: "0.06em" }}
              >
                {user.displayName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user.email ?? user.username ?? "Authenticated"}
              </p>
            </div>
          </div>
          <SignOutButton
            className="w-full rounded-none text-[10px] font-bold uppercase"
            variant="outline"
          />
        </div>

        <p
          className="px-3 pb-2 text-[10px] font-semibold uppercase text-muted-foreground/50"
          style={{ letterSpacing: "0.18em" }}
        >
          COMMAND CENTER
        </p>
        {navItems.map((item) => renderNavLink(item))}
      </aside>
    </>
  );
}
