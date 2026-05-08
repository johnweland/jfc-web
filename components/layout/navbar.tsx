"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/context";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "FIREARMS", href: "/firearms" },
  { label: "PARTS", href: "/parts" },
  { label: "APPAREL", href: "/apparel" },
  { label: "FFL INFO", href: "/ffl-info" },
];

export function Navbar() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActiveLink = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

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
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center px-4 font-display text-xs font-semibold uppercase transition-colors",
                    isActive
                      ? "bg-surface-container-highest text-foreground"
                      : "text-muted-foreground hover:bg-surface-container-high hover:text-accent",
                  )}
                  style={{ letterSpacing: "0.12em" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="md:hidden"
                >
                  <Menu className="size-4 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-sm border-r border-border/40 px-0">
                <SheetHeader className="border-b border-border/30 px-6 py-5 text-left">
                  <SheetTitle className="font-display text-base font-semibold uppercase tracking-[0.18em]">
                    Navigation
                  </SheetTitle>
                  <SheetDescription>
                    Browse Jackson Firearm Co. collections and your account.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col">
                  <nav className="flex flex-col px-3 py-4">
                    {navLinks.map((link) => {
                      const isActive = isActiveLink(link.href);

                      return (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-12 items-center rounded-lg px-3 font-display text-sm font-semibold uppercase transition-colors",
                              isActive
                                ? "bg-surface-container-highest text-foreground"
                                : "text-muted-foreground hover:bg-surface-container-high hover:text-accent",
                            )}
                            style={{ letterSpacing: "0.12em" }}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>

                  <div className="mt-auto border-t border-border/30 px-3 py-4">
                    <SheetClose asChild>
                      <Link
                        href="/account"
                        className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-high"
                      >
                        <User className="size-4 text-muted-foreground" />
                        <span>My account</span>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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
