import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { ProductCard } from "@/components/ui/product-card";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";
import { ApparelDetailActions } from "@/components/ui/apparel-detail-actions";
import { getLiveProductBySlug, getLiveProductsByCategory } from "@/lib/catalog/live";
import type { Apparel } from "@/lib/data/types";

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ApparelDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = (await getLiveProductBySlug(slug, "apparel")) as Apparel | undefined;

  if (!item) notFound();

  const related = ((await getLiveProductsByCategory("apparel")) as Apparel[])
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-surface-container py-4">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <Link
            href="/apparel"
            className="flex items-center gap-2 text-xs uppercase text-muted-foreground hover:text-foreground transition-colors"
            style={{ letterSpacing: "0.1em" }}
          >
            <ArrowLeft className="size-3.5" />
            Back to Apparel
          </Link>
        </div>
      </div>

      {/* Product hero */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Image */}
            <ProductImageGallery
              images={item.images}
              productName={item.name}
              emptyLabel="APPAREL IMAGE"
            />

            {/* Details */}
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="font-display text-[10px] font-medium uppercase text-muted-foreground mb-2"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {item.sku} &nbsp;·&nbsp; {item.apparelType}
                  </p>
                  <h1
                    className="font-display text-3xl font-bold uppercase text-foreground"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {item.name}
                  </h1>
                </div>
                <AvailabilityBadge status={item.status} className="mt-2 shrink-0" />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-foreground">
                  {formatPrice(item.price)}
                </span>
                {item.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(item.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              <ApparelDetailActions item={item} />
            </div>
          </div>
        </div>
      </section>

      {/* Related items */}
      {related.length > 0 && (
        <section className="bg-surface-container-low py-20">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-3"
              style={{ letterSpacing: "0.18em" }}
            >
              More Apparel
            </p>
            <h2
              className="font-display text-2xl font-bold uppercase text-foreground mb-10"
              style={{ letterSpacing: "-0.02em" }}
            >
              COMPLETE THE KIT
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ProductCard key={a.slug} product={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
