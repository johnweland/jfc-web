import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const quickLinks = [
  { label: "Firearms", href: "/firearms" },
  { label: "Parts & Accessories", href: "/parts" },
  { label: "Apparel", href: "/apparel" },
  { label: "FFL Information", href: "/ffl-info" },
];

const fflLinks = [
  { label: "FFL Transfer Process", href: "/ffl-info" },
  { label: "Find a Transfer FFL", href: "/ffl-info#find-ffl" },
  { label: "Compliance FAQ", href: "/ffl-info#faq" },
];

const accountLinks = [
  { label: "My Account",    href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "My Cart",       href: "/cart" },
];

export function Footer() {
  return (
    <footer className="bg-surface-container-low mt-auto">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span
              className="font-display text-sm font-bold uppercase text-foreground"
              style={{ letterSpacing: "0.12em" }}
            >
              JACKSON FIREARM CO.
            </span>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Federal Firearms Licensee. Premium firearms, parts, and tactical
              apparel for the modern operator. Est. 2025.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="font-display text-xs font-semibold uppercase text-foreground mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              Shop
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* FFL Info */}
          <div>
            <h3
              className="font-display text-xs font-semibold uppercase text-foreground mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              FFL & Compliance
            </h3>
            <ul className="space-y-3">
              {fflLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3
              className="font-display text-xs font-semibold uppercase text-foreground mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              Account
            </h3>
            <ul className="space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="font-display text-xs font-semibold uppercase text-foreground mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              Contact
            </h3>
            <address className="not-italic space-y-3">
              <p className="text-sm text-muted-foreground">
                600 2nd Street <br /> Jackson MN 56143
              </p>
              <p className="text-sm text-muted-foreground">
                <a
                  href="tel:+15551234567"
                  className="hover:text-accent transition-colors"
                >
                  (507) 675-4337
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                <a
                  href="mailto:info@jacksonfirearmco.com"
                  className="hover:text-accent transition-colors"
                >
                  info@jacksonfirearmco.com
                </a>
              </p>
            </address>
          </div>
        </div>

        <Separator className="my-10 bg-border/30" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Jackson Firearm Co. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground max-w-lg">
            <strong className="text-foreground/60">COMPLIANCE NOTICE:</strong>{" "}
            All firearm sales are subject to federal, state, and local laws.
            Complete firearms require FFL transfer. We reserve the right to
            refuse any sale.
          </p>
        </div>
      </div>
    </footer>
  );
}
