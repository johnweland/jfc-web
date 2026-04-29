import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { ProductCard } from "@/components/ui/product-card";
import { AddToCartButton } from "@/components/ui/add-to-cart-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { parts } from "@/lib/data/parts";

export function generateStaticParams() {
  return parts.map((p) => ({ slug: p.slug }));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PartDetailPage({ params }: Props) {
  const { slug } = await params;
  const part = parts.find((p) => p.slug === slug);

  if (!part) notFound();

  const related = parts.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-surface-container py-4">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <Link
            href="/parts"
            className="flex items-center gap-2 text-xs uppercase text-muted-foreground hover:text-foreground transition-colors"
            style={{ letterSpacing: "0.1em" }}
          >
            <ArrowLeft className="size-3.5" />
            Back to Parts
          </Link>
        </div>
      </div>

      {/* Product hero */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Image */}
            <div className="aspect-[4/3] bg-surface-container-low flex items-center justify-center">
              <span
                className="font-display text-sm uppercase text-muted-foreground/30 tracking-widest"
                style={{ letterSpacing: "0.2em" }}
              >
                PART IMAGE
              </span>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="font-display text-[10px] font-medium uppercase text-muted-foreground mb-2"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {part.sku} &nbsp;·&nbsp; {part.partType}
                  </p>
                  <h1
                    className="font-display text-3xl font-bold uppercase text-foreground"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {part.name}
                  </h1>
                </div>
                <AvailabilityBadge status={part.status} className="mt-2 shrink-0" />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-foreground">
                  {formatPrice(part.price)}
                </span>
                {part.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(part.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {part.description}
              </p>

              <Separator className="bg-border/30" />

              {/* Compatibility */}
              <div>
                <p
                  className="font-display text-[10px] font-semibold uppercase text-primary mb-3"
                  style={{ letterSpacing: "0.15em" }}
                >
                  Compatible With
                </p>
                <ul className="flex flex-wrap gap-2">
                  {part.compatibility.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check className="size-3 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="bg-border/30" />

              {/* CTAs */}
              <AddToCartButton
                product={{
                  slug: part.slug,
                  name: part.name,
                  sku: part.sku,
                  price: part.price,
                  category: "part",
                  requiresFFL: part.requiresFFL,
                }}
                backordered={part.status === "backordered"}
              />
              <FavoriteButton
                product={{
                  slug: part.slug,
                  name: part.name,
                  sku: part.sku,
                  price: part.price,
                  category: "part",
                  status: part.status,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related parts */}
      {related.length > 0 && (
        <section className="bg-surface-container-low py-20">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-3"
              style={{ letterSpacing: "0.18em" }}
            >
              More Parts
            </p>
            <h2
              className="font-display text-2xl font-bold uppercase text-foreground mb-10"
              style={{ letterSpacing: "-0.02em" }}
            >
              YOU MIGHT ALSO NEED
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
