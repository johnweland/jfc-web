import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fflInfoPageContent } from "@/lib/data";

export default function FFLInfoPage() {
  const { hero, transferPaths, ourFfl, faq, resources, cta } = fflInfoPageContent;

  const stepIcons = [ArrowRight, FileText, MapPin];

  return (
    <>
      {/* Hero */}
      <section className="topo-bg bg-surface-container py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <Shield className="size-10 text-primary mb-6" />
          <p
            className="font-display text-xs font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.18em" }}
          >
            {hero.eyebrow}
          </p>
          <h1
            className="font-display font-bold text-foreground"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              letterSpacing: "-0.03em",
            }}
          >
            {hero.title}
            <br />
            <span className="text-primary">{hero.accent}</span>
          </h1>
          <p className="mt-6 text-base text-muted-foreground max-w-xl leading-relaxed">
            {hero.description}
          </p>
        </div>
      </section>

      {/* Transfer Paths */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <p
            className="font-display text-xs font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.18em" }}
          >
            The Process
          </p>
          <h2
            className="font-display text-2xl font-bold uppercase text-foreground mb-16"
            style={{ letterSpacing: "-0.02em" }}
          >
            TWO PATHS. ONE CLEAR PROCESS.
          </h2>

          <div className="grid grid-cols-1 gap-12 xl:grid-cols-2 xl:items-stretch">
            {transferPaths.map((path) => (
              <div key={path.id} className="flex h-full flex-col">
                <p
                  className="font-display text-xs font-semibold uppercase text-primary mb-3"
                  style={{ letterSpacing: "0.18em" }}
                >
                  {path.eyebrow}
                </p>
                <h3
                  className="font-display text-xl font-bold uppercase text-foreground mb-4"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {path.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  {path.description}
                </p>

                <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-3">
                  {path.steps.map((step, index) => {
                    const Icon = stepIcons[index] ?? ArrowRight;

                    return (
                      <div
                        key={step.step}
                        className={`flex h-full flex-col gap-5 bg-surface-container-low p-8 ${
                          index < path.steps.length - 1 ? "lg:border-r border-border/20" : ""
                        }`}
                      >
                        <span
                          className="font-display text-5xl font-bold text-primary/20"
                          style={{ letterSpacing: "-0.04em" }}
                        >
                          {step.step}
                        </span>
                        <Icon className="size-6 text-primary" />
                        <h4
                          className="font-display text-sm font-bold uppercase text-foreground"
                          style={{ letterSpacing: "0.06em" }}
                        >
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our FFL */}
      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="max-w-3xl mb-10">
            <ShieldCheck className="size-8 text-primary mb-6" />
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-3"
              style={{ letterSpacing: "0.18em" }}
            >
              {ourFfl.eyebrow}
            </p>
            <h2
              className="font-display text-2xl font-bold uppercase text-foreground mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              {ourFfl.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ourFfl.description}
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Receiving Instructions",
                items: ourFfl.receivingInstructions,
              },
              {
                title: "Buyer Checklist",
                items: ourFfl.buyerChecklist,
              },
              {
                title: "Sender Checklist",
                items: ourFfl.sellerChecklist,
              },
            ].map((section) => (
              <div key={section.title} className="h-full bg-surface p-6">
                <h3
                  className="font-display text-sm font-bold uppercase text-foreground mb-4"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex h-full flex-col bg-surface p-6">
              <Phone className="mb-6 size-8 text-primary" />
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-3"
                style={{ letterSpacing: "0.18em" }}
              >
                Receiving Contact
              </p>
              <h3
                className="font-display text-sm font-bold uppercase text-foreground mb-4"
                style={{ letterSpacing: "0.06em" }}
              >
                {ourFfl.contact.businessName}
              </h3>
              <address className="not-italic space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>FFL: {ourFfl.contact.licenseNumber}</p>
                {ourFfl.contact.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>
                  <a
                    href={ourFfl.contact.phoneHref}
                    className="hover:text-accent transition-colors"
                  >
                    {ourFfl.contact.phone}
                  </a>
                </p>
                <p>
                  <a
                    href={ourFfl.contact.emailHref}
                    className="hover:text-accent transition-colors"
                  >
                    {ourFfl.contact.email}
                  </a>
                </p>
              </address>
              <p
                className="mt-auto pt-6 text-[10px] uppercase text-muted-foreground/50"
                style={{ letterSpacing: "0.08em" }}
              >
                {ourFfl.contact.hours}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-surface py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <p
            className="font-display text-xs font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.18em" }}
          >
            {faq.eyebrow}
          </p>
          <h2
            className="font-display text-2xl font-bold uppercase text-foreground mb-12"
            style={{ letterSpacing: "-0.02em" }}
          >
            {faq.title}
          </h2>

          <div className="max-w-3xl divide-y divide-border/20">
            {faq.items.map((item) => (
              <div key={item.q} className="py-6">
                <h3
                  className="font-display text-sm font-semibold uppercase text-foreground mb-3"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find an FFL / Contact */}
      <section id="find-ffl" className="bg-surface py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <div>
              <MapPin className="size-8 text-primary mb-6" />
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-3"
                style={{ letterSpacing: "0.18em" }}
              >
                {resources.dealerLocator.eyebrow}
              </p>
              <h2
                className="font-display text-xl font-bold uppercase text-foreground mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                {resources.dealerLocator.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {resources.dealerLocator.description}
              </p>
              <p className="text-xs text-muted-foreground/60 mb-6">
                {resources.dealerLocator.note}
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-none border-border/30 text-foreground hover:bg-surface-container"
              >
                <a
                  href={resources.dealerLocator.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {resources.dealerLocator.link.label}
                </a>
              </Button>
            </div>

            <div>
              <Phone className="size-8 text-primary mb-6" />
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-3"
                style={{ letterSpacing: "0.18em" }}
              >
                {resources.contact.eyebrow}
              </p>
              <h2
                className="font-display text-xl font-bold uppercase text-foreground mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                {resources.contact.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {resources.contact.description}
              </p>
              <address className="not-italic text-sm text-muted-foreground leading-relaxed space-y-2 mb-6">
                <p>{ourFfl.contact.businessName}</p>
                <p>FFL: {ourFfl.contact.licenseNumber}</p>
                {ourFfl.contact.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>
                  <a
                    href={ourFfl.contact.phoneHref}
                    className="hover:text-accent transition-colors"
                  >
                    {ourFfl.contact.phone}
                  </a>
                </p>
                <p>
                  <a
                    href={ourFfl.contact.emailHref}
                    className="hover:text-accent transition-colors"
                  >
                    {ourFfl.contact.email}
                  </a>
                </p>
              </address>
              <p
                className="text-[10px] uppercase text-muted-foreground/50"
                style={{ letterSpacing: "0.08em" }}
              >
                {ourFfl.contact.hours}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-border/20" />

      {/* CTA */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            {cta.description}
          </p>
          <Button
            asChild
            size="lg"
            className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 px-10"
            style={{ letterSpacing: "0.1em" }}
          >
            <Link href={cta.href}>
              {cta.label} <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
