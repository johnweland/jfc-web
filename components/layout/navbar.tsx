"use client";

import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/context";

const navLinks = [
  { label: "FIREARMS", href: "/firearms" },
  { label: "PARTS", href: "/parts" },
  { label: "APPAREL", href: "/apparel" },
  { label: "FFL INFO", href: "/ffl-info" },
];

export function Navbar() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span
              className="font-display text-xl font-bold tracking-widest text-foreground uppercase"
              style={{ letterSpacing: "0.12em" }}
            >
              JACKSON FIREARM CO.
            </span>
            <span
              className="text-[0.6rem] font-medium uppercase text-muted-foreground"
              style={{ letterSpacing: "0.18em" }}
            >
              Est. 2025 &nbsp;|&nbsp; Premium Precision
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-accent"
                style={{ letterSpacing: "0.12em" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="size-4 text-muted-foreground" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Account" asChild>
              <Link href="/account">
                <User className="size-4 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
