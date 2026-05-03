"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  MapPin,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Schema } from "@/amplify/data/resource";
import { useCart } from "@/lib/cart/context";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

type FormState = {
  email: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  fflName: string;
  fflNumber: string;
  fflContact: string;
  fflPhone: string;
  fflEmail: string;
  fflLine1: string;
  fflLine2: string;
  fflCity: string;
  fflState: string;
  fflPostalCode: string;
  notes: string;
};

type CustomerAddressRecord = Schema["CustomerAddress"]["type"];
type CustomerFflLocationRecord = Schema["CustomerFflLocation"]["type"];
type CustomerProfileRecord = Schema["CustomerProfile"]["type"];

function sortShipping(addresses: CustomerAddressRecord[]) {
  return [...addresses].sort((left, right) => {
    if (left.isDefault === right.isDefault) {
      return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
    }

    return left.isDefault ? -1 : 1;
  });
}

function sortFflLocations(locations: CustomerFflLocationRecord[]) {
  return [...locations].sort((left, right) => {
    if (left.isDefault === right.isDefault) {
      return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
    }

    return left.isDefault ? -1 : 1;
  });
}

function blankShippingFields() {
  return {
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  };
}

function blankFflFields() {
  return {
    fflName: "",
    fflNumber: "",
    fflContact: "",
    fflPhone: "",
    fflEmail: "",
    fflLine1: "",
    fflLine2: "",
    fflCity: "",
    fflState: "",
    fflPostalCode: "",
    notes: "",
  };
}

const REQUIRED_SHIPPING_KEYS = [
  "email",
  "recipientName",
  "phone",
  "line1",
  "city",
  "state",
  "postalCode",
] as const satisfies readonly (keyof FormState)[];

const REQUIRED_FFL_KEYS = [
  "fflName",
  "fflContact",
  "fflLine1",
  "fflCity",
  "fflState",
  "fflPostalCode",
] as const satisfies readonly (keyof FormState)[];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const STATE_PATTERN = /^[A-Za-z]{2}$/;

function isRequired(key: keyof FormState, hasFfl: boolean) {
  if ((REQUIRED_SHIPPING_KEYS as readonly string[]).includes(key)) {
    return true;
  }
  if (hasFfl && (REQUIRED_FFL_KEYS as readonly string[]).includes(key)) {
    return true;
  }
  return false;
}

function validateField(
  key: keyof FormState,
  value: string,
  hasFfl: boolean,
): string | null {
  const trimmed = value.trim();

  if (isRequired(key, hasFfl) && trimmed.length === 0) {
    return "Required";
  }

  if (trimmed.length === 0) {
    return null;
  }

  if (key === "email" || key === "fflEmail") {
    return EMAIL_PATTERN.test(trimmed) ? null : "Enter a valid email address";
  }

  if (key === "postalCode" || key === "fflPostalCode") {
    return ZIP_PATTERN.test(trimmed) ? null : "Enter a 5-digit ZIP code or ZIP+4";
  }

  if (key === "state" || key === "fflState") {
    return STATE_PATTERN.test(trimmed) ? null : "Enter the 2-letter state code";
  }

  return null;
}

function validateForm(form: FormState, hasFfl: boolean) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
    const message = validateField(key, form[key], hasFfl);
    if (message) {
      errors[key] = message;
    }
  });
  return errors;
}

function fieldId(key: keyof FormState) {
  return `field-${key}`;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase text-muted-foreground/60"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
        {required ? (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 normal-case text-muted-foreground/40">(optional)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        aria-required={required || undefined}
        className={`border bg-surface-container px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary ${
          error ? "border-destructive" : "border-border/30"
        }`}
      />
      {error ? (
        <span id={errorId} className="text-[11px] text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, estimatedTax, total } = useCart();
  const hasFfl = items.some((item) => item.requiresFFL);
  const client = useMemo(() => generateClient<Schema>(), []);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [savedShipping, setSavedShipping] = useState<CustomerAddressRecord[]>([]);
  const [savedFfls, setSavedFfls] = useState<CustomerFflLocationRecord[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [selectedFflId, setSelectedFflId] = useState<string | null>(null);
  const [savedDestinationsLoaded, setSavedDestinationsLoaded] = useState(false);
  const [saveShippingToAccount, setSaveShippingToAccount] = useState(false);
  const [saveFflToAccount, setSaveFflToAccount] = useState(false);
  const [savingSelections, setSavingSelections] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [form, setForm] = useState<FormState>({
    email: "",
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    fflName: "",
    fflNumber: "",
    fflContact: "",
    fflPhone: "",
    fflEmail: "",
    fflLine1: "",
    fflLine2: "",
    fflCity: "",
    fflState: "",
    fflPostalCode: "",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setIsSignedIn(true);
        setCustomerId(user.userId);
        const loginId = user.signInDetails?.loginId;
        if (loginId) {
          setForm((current) => (current.email ? current : { ...current, email: loginId }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsSignedIn(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !customerId) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      client.models.CustomerProfile.get({ customerId }),
      client.models.CustomerAddress.list({
        filter: { customerId: { eq: customerId } },
      }),
      client.models.CustomerFflLocation.list({
        filter: { customerId: { eq: customerId } },
      }),
    ])
      .then(([profileResult, addressResult, fflResult]) => {
        if (cancelled) {
          return;
        }

        const profile = profileResult.data as CustomerProfileRecord | undefined;
        const shipping = sortShipping(addressResult.data ?? []);
        const ffls = sortFflLocations(fflResult.data ?? []);

        setSavedShipping(shipping);
        setSavedFfls(ffls);

        const defaultShipping =
          shipping.find((address) => address.id === profile?.defaultShippingAddressId) ??
          shipping.find((address) => address.isDefault) ??
          shipping[0];

        const defaultFfl =
          ffls.find((dealer) => dealer.id === profile?.defaultFflLocationId) ??
          ffls.find((dealer) => dealer.isDefault) ??
          ffls[0];

        if (defaultShipping) {
          setSelectedShippingId(defaultShipping.id);
        }
        if (defaultFfl) {
          setSelectedFflId(defaultFfl.id);
        }

        if (defaultShipping) {
          setForm((current) => ({
            ...current,
            recipientName: current.recipientName || defaultShipping.recipientName || "",
            phone: current.phone || defaultShipping.phone || "",
            line1: current.line1 || defaultShipping.line1,
            line2: current.line2 || defaultShipping.line2 || "",
            city: current.city || defaultShipping.city,
            state: current.state || defaultShipping.state,
            postalCode: current.postalCode || defaultShipping.postalCode,
          }));
        }

        if (defaultFfl) {
          setForm((current) => ({
            ...current,
            fflName: current.fflName || defaultFfl.fflName,
            fflNumber: current.fflNumber || defaultFfl.fflNumber || "",
            fflContact: current.fflContact || defaultFfl.contactName || "",
            fflPhone: current.fflPhone || defaultFfl.phone || "",
            fflEmail: current.fflEmail || defaultFfl.email || "",
            fflLine1: current.fflLine1 || defaultFfl.address?.line1 || "",
            fflLine2: current.fflLine2 || defaultFfl.address?.line2 || "",
            fflCity: current.fflCity || defaultFfl.address?.city || "",
            fflState: current.fflState || defaultFfl.address?.state || "",
            fflPostalCode: current.fflPostalCode || defaultFfl.address?.postalCode || "",
            notes: current.notes || defaultFfl.notes || "",
          }));
        }
      })
      .catch((error) => {
        console.error("[checkout] unable to load saved destinations", error);
      })
      .finally(() => {
        if (!cancelled) {
          setSavedDestinationsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, customerId, isSignedIn]);

  const savedDestinationsLoading = isSignedIn && Boolean(customerId) && !savedDestinationsLoaded;
  const steps = showReview
    ? [
        { num: "01", label: "CART", active: false, complete: true },
        { num: "02", label: "DETAILS", active: false, complete: true },
        { num: "03", label: "REVIEW", active: true, complete: false },
      ]
    : [
        { num: "01", label: "CART", active: false, complete: true },
        { num: "02", label: "DETAILS", active: true, complete: false },
        { num: "03", label: "REVIEW", active: false, complete: false },
      ];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaveMessage(null);
    setReviewMessage(null);
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleBlur(key: keyof FormState) {
    const message = validateField(key, form[key], hasFfl);
    setFieldErrors((current) => {
      if (message) {
        if (current[key] === message) return current;
        return { ...current, [key]: message };
      }
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function applySavedShipping(address: CustomerAddressRecord) {
    setSelectedShippingId(address.id);
    setSaveShippingToAccount(false);
    const next: FormState = {
      ...form,
      recipientName: address.recipientName ?? "",
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    };
    setForm(next);
    setFieldErrors(validateForm(next, hasFfl));
  }

  function applySavedFfl(dealer: CustomerFflLocationRecord) {
    setSelectedFflId(dealer.id);
    setSaveFflToAccount(false);
    const next: FormState = {
      ...form,
      fflName: dealer.fflName,
      fflNumber: dealer.fflNumber ?? "",
      fflContact: dealer.contactName ?? "",
      fflPhone: dealer.phone ?? "",
      fflEmail: dealer.email ?? "",
      fflLine1: dealer.address?.line1 ?? "",
      fflLine2: dealer.address?.line2 ?? "",
      fflCity: dealer.address?.city ?? "",
      fflState: dealer.address?.state ?? "",
      fflPostalCode: dealer.address?.postalCode ?? "",
      notes: dealer.notes ?? "",
    };
    setForm(next);
    setFieldErrors(validateForm(next, hasFfl));
  }

  function clearForDifferentShippingAddress() {
    setSelectedShippingId(null);
    setSaveShippingToAccount(false);
    setSaveMessage(null);
    setFieldErrors((current) => {
      const next = { ...current };
      (Object.keys(blankShippingFields()) as (keyof FormState)[]).forEach((key) => {
        delete next[key];
      });
      return next;
    });
    setForm((current) => ({
      ...current,
      ...blankShippingFields(),
    }));
  }

  function clearForDifferentFflAddress() {
    setSelectedFflId(null);
    setSaveFflToAccount(false);
    setSaveMessage(null);
    setFieldErrors((current) => {
      const next = { ...current };
      (Object.keys(blankFflFields()) as (keyof FormState)[]).forEach((key) => {
        delete next[key];
      });
      return next;
    });
    setForm((current) => ({
      ...current,
      ...blankFflFields(),
    }));
  }

  function normalize(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase();
  }

  async function persistOptionalSelections() {
    if (!isSignedIn || !customerId) {
      return;
    }

    const saves: Promise<unknown>[] = [];
    let savedSomething = false;

    if (saveShippingToAccount && !selectedShippingId) {
      const existingShipping = savedShipping.find((address) =>
        normalize(address.recipientName) === normalize(form.recipientName) &&
        normalize(address.phone) === normalize(form.phone) &&
        normalize(address.line1) === normalize(form.line1) &&
        normalize(address.line2) === normalize(form.line2) &&
        normalize(address.city) === normalize(form.city) &&
        normalize(address.state) === normalize(form.state) &&
        normalize(address.postalCode) === normalize(form.postalCode),
      );

      if (!existingShipping) {
        saves.push(
          client.models.CustomerAddress.create({
            customerId,
            recipientName: form.recipientName.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || null,
            city: form.city.trim(),
            state: form.state.trim().toUpperCase().slice(0, 2),
            postalCode: form.postalCode.trim(),
            country: "US",
            isDefault: false,
          }).then(({ data }) => {
            if (data) {
              savedSomething = true;
              setSavedShipping((current) => sortShipping([...current, data]));
              setSelectedShippingId(data.id);
            }
          }),
        );
      }
    }

    if (hasFfl && saveFflToAccount && !selectedFflId) {
      const existingFfl = savedFfls.find((dealer) =>
        normalize(dealer.fflName) === normalize(form.fflName) &&
        normalize(dealer.contactName) === normalize(form.fflContact) &&
        normalize(dealer.address?.line1) === normalize(form.fflLine1) &&
        normalize(dealer.address?.line2) === normalize(form.fflLine2) &&
        normalize(dealer.address?.city) === normalize(form.fflCity) &&
        normalize(dealer.address?.state) === normalize(form.fflState) &&
        normalize(dealer.address?.postalCode) === normalize(form.fflPostalCode),
      );

      if (!existingFfl) {
        saves.push(
          client.models.CustomerFflLocation.create({
            customerId,
            fflName: form.fflName.trim(),
            fflNumber: form.fflNumber.trim() || null,
            contactName: form.fflContact.trim() || null,
            phone: form.fflPhone.trim() || null,
            email: form.fflEmail.trim() || null,
            address: {
              recipientName: form.fflContact.trim() || null,
              phone: form.fflPhone.trim() || null,
              line1: form.fflLine1.trim(),
              line2: form.fflLine2.trim() || null,
              city: form.fflCity.trim(),
              state: form.fflState.trim().toUpperCase().slice(0, 2),
              postalCode: form.fflPostalCode.trim(),
              country: "US",
            },
            isDefault: false,
            notes: form.notes.trim() || null,
          }).then(({ data }) => {
            if (data) {
              savedSomething = true;
              setSavedFfls((current) => sortFflLocations([...current, data]));
              setSelectedFflId(data.id);
            }
          }),
        );
      }
    }

    if (saves.length === 0) {
      return;
    }

    setSavingSelections(true);
    try {
      await Promise.all(saves);
      if (savedSomething) {
        setSaveMessage("Saved to your account for next time.");
      }
    } catch (error) {
      console.error("[checkout] unable to save checkout destinations", error);
      setSaveMessage("We couldn’t save one of those destinations, but your checkout details are still here.");
    } finally {
      setSavingSelections(false);
    }
  }

  async function handleReviewOrder() {
    const errors = validateForm(form, hasFfl);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setReviewMessage("Fix the highlighted fields before continuing.");
      const firstKey = (Object.keys(errors) as (keyof FormState)[])[0];
      const target = document.getElementById(fieldId(firstKey));
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    await persistOptionalSelections();
    setReviewMessage(null);
    setShowReview(true);
  }

  function handlePlaceOrder() {
    setReviewMessage(
      "Review is ready. Order submission still needs to be connected to payment and order creation.",
    );
  }

  if (items.length === 0) {
    return (
      <main className="bg-surface min-h-screen">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary"
            style={{ letterSpacing: "0.18em" }}
          >
            CHECKOUT
          </p>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            YOUR ARMORY IS EMPTY
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Add firearms, parts, or apparel to your cart before proceeding to checkout.
          </p>
          <Button
            asChild
            className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 gap-2 text-xs"
            style={{ letterSpacing: "0.12em" }}
          >
            <Link href="/firearms">
              BROWSE FIREARMS
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-surface min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-6 py-10 lg:px-12">
        <div className="mb-8">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            JACKSON FIREARM CO.
          </p>
          <h1
            className="font-display text-3xl font-bold uppercase text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            CHECKOUT
          </h1>
        </div>

        <div className="flex items-center mb-10">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase ${
                  step.active
                    ? "bg-primary text-primary-foreground"
                    : step.complete
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-container text-muted-foreground/40"
                }`}
                style={{ letterSpacing: "0.1em" }}
              >
                <span>{step.num}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-px ${step.active || step.complete ? "bg-primary/40" : "bg-border/30"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            {!showReview ? (
              <>
            <section className="bg-surface-container-low p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <UserRound className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p
                      className="font-display text-[10px] font-semibold uppercase text-primary"
                      style={{ letterSpacing: "0.16em" }}
                    >
                      Account
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isSignedIn
                        ? "Signed in. You can use your saved shipping and transfer destinations."
                        : "Sign in to pull in saved shipping addresses and preferred transfer dealers."}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-border/30 text-[10px] font-bold uppercase"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <Link href={isSignedIn ? "/account/addresses" : "/sign-in?redirect=%2Fcheckout"}>
                    {isSignedIn ? "MANAGE SAVED DESTINATIONS" : "SIGN IN"}
                  </Link>
                </Button>
              </div>
            </section>

            <section className="bg-surface-container-low p-6">
              <div className="flex items-start gap-3 mb-5">
                <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p
                    className="font-display text-[10px] font-semibold uppercase text-primary"
                    style={{ letterSpacing: "0.16em" }}
                  >
                    Shipping Details
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the destination for this order. You can save permanent addresses from your account area.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id={fieldId("email")}
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(value) => update("email", value)}
                  onBlur={() => handleBlur("email")}
                  error={fieldErrors.email}
                />
                <Field
                  id={fieldId("phone")}
                  label="Phone"
                  required
                  value={form.phone}
                  onChange={(value) => update("phone", value)}
                  onBlur={() => handleBlur("phone")}
                  error={fieldErrors.phone}
                />
                <Field
                  id={fieldId("recipientName")}
                  label="Recipient Name"
                  required
                  value={form.recipientName}
                  onChange={(value) => update("recipientName", value)}
                  onBlur={() => handleBlur("recipientName")}
                  error={fieldErrors.recipientName}
                />
                <Field
                  id={fieldId("line1")}
                  label="Address Line 1"
                  required
                  value={form.line1}
                  onChange={(value) => update("line1", value)}
                  onBlur={() => handleBlur("line1")}
                  error={fieldErrors.line1}
                />
                <Field
                  id={fieldId("line2")}
                  label="Address Line 2"
                  value={form.line2}
                  onChange={(value) => update("line2", value)}
                />
                <Field
                  id={fieldId("city")}
                  label="City"
                  required
                  value={form.city}
                  onChange={(value) => update("city", value)}
                  onBlur={() => handleBlur("city")}
                  error={fieldErrors.city}
                />
                <Field
                  id={fieldId("state")}
                  label="State"
                  required
                  value={form.state}
                  onChange={(value) => update("state", value)}
                  onBlur={() => handleBlur("state")}
                  error={fieldErrors.state}
                />
                <Field
                  id={fieldId("postalCode")}
                  label="Postal Code"
                  required
                  value={form.postalCode}
                  onChange={(value) => update("postalCode", value)}
                  onBlur={() => handleBlur("postalCode")}
                  error={fieldErrors.postalCode}
                />
              </div>

              {isSignedIn ? (
                <div className="mt-6">
                  <p
                    className="text-[10px] font-semibold uppercase text-muted-foreground/60"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    Saved Shipping Addresses
                  </p>
                  {savedDestinationsLoading ? (
                    <p className="mt-2 text-sm text-muted-foreground">Loading saved addresses…</p>
                  ) : savedShipping.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <Select
                        value={selectedShippingId ?? "different"}
                        onValueChange={(value) => {
                          if (value === "different") {
                            clearForDifferentShippingAddress();
                            return;
                          }

                          const address = savedShipping.find((entry) => entry.id === value);
                          if (address) {
                            applySavedShipping(address);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full rounded-none border-border/30 bg-surface-container px-3">
                          <SelectValue placeholder="Select a saved shipping address" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="different">Use Different Address</SelectItem>
                          {savedShipping.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.label || address.recipientName || address.line1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedShippingId ? (
                        <div className="border border-primary/30 bg-primary/5 p-4">
                          {(() => {
                            const selected = savedShipping.find((address) => address.id === selectedShippingId);
                            if (!selected) return null;

                            return (
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {selected.label || selected.recipientName || "Saved address"}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {selected.line1}{selected.line2 ? `, ${selected.line2}` : ""}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {selected.city}, {selected.state} {selected.postalCode}
                                  </p>
                                </div>
                                <Check className="size-4 shrink-0 text-primary" />
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No saved shipping addresses yet. You can keep filling the form manually or add one from your account.
                    </p>
                  )}
                </div>
              ) : null}

              {isSignedIn && !selectedShippingId ? (
                <label className="mt-5 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={saveShippingToAccount}
                    onChange={(event) => setSaveShippingToAccount(event.target.checked)}
                    className="size-4 border-border/30"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Save this shipping address to my account
                  </span>
                </label>
              ) : null}
            </section>

            {hasFfl && (
              <section className="bg-surface-container-low p-6">
                <div className="flex items-start gap-3 mb-5">
                  <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p
                      className="font-display text-[10px] font-semibold uppercase text-primary"
                      style={{ letterSpacing: "0.16em" }}
                    >
                      Receiving FFL
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      One or more items require dealer transfer. Add the receiving FFL information for this order.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id={fieldId("fflName")}
                    label="FFL Name"
                    required
                    value={form.fflName}
                    onChange={(value) => update("fflName", value)}
                    onBlur={() => handleBlur("fflName")}
                    error={fieldErrors.fflName}
                  />
                  <Field
                    id={fieldId("fflNumber")}
                    label="FFL Number"
                    value={form.fflNumber}
                    onChange={(value) => update("fflNumber", value)}
                  />
                  <Field
                    id={fieldId("fflContact")}
                    label="Contact Name"
                    required
                    value={form.fflContact}
                    onChange={(value) => update("fflContact", value)}
                    onBlur={() => handleBlur("fflContact")}
                    error={fieldErrors.fflContact}
                  />
                  <Field
                    id={fieldId("fflPhone")}
                    label="FFL Phone"
                    value={form.fflPhone}
                    onChange={(value) => update("fflPhone", value)}
                  />
                  <Field
                    id={fieldId("fflEmail")}
                    label="FFL Email"
                    type="email"
                    value={form.fflEmail}
                    onChange={(value) => update("fflEmail", value)}
                    onBlur={() => handleBlur("fflEmail")}
                    error={fieldErrors.fflEmail}
                  />
                  <Field
                    id={fieldId("fflLine1")}
                    label="FFL Address Line 1"
                    required
                    value={form.fflLine1}
                    onChange={(value) => update("fflLine1", value)}
                    onBlur={() => handleBlur("fflLine1")}
                    error={fieldErrors.fflLine1}
                  />
                  <Field
                    id={fieldId("fflLine2")}
                    label="FFL Address Line 2"
                    value={form.fflLine2}
                    onChange={(value) => update("fflLine2", value)}
                  />
                  <Field
                    id={fieldId("fflCity")}
                    label="FFL City"
                    required
                    value={form.fflCity}
                    onChange={(value) => update("fflCity", value)}
                    onBlur={() => handleBlur("fflCity")}
                    error={fieldErrors.fflCity}
                  />
                  <Field
                    id={fieldId("fflState")}
                    label="FFL State"
                    required
                    value={form.fflState}
                    onChange={(value) => update("fflState", value)}
                    onBlur={() => handleBlur("fflState")}
                    error={fieldErrors.fflState}
                  />
                  <Field
                    id={fieldId("fflPostalCode")}
                    label="FFL Postal Code"
                    required
                    value={form.fflPostalCode}
                    onChange={(value) => update("fflPostalCode", value)}
                    onBlur={() => handleBlur("fflPostalCode")}
                    error={fieldErrors.fflPostalCode}
                  />
                  <Field
                    id={fieldId("notes")}
                    label="Notes"
                    value={form.notes}
                    onChange={(value) => update("notes", value)}
                  />
                </div>

                {isSignedIn ? (
                  <div className="mt-6">
                    <p
                      className="text-[10px] font-semibold uppercase text-muted-foreground/60"
                      style={{ letterSpacing: "0.12em" }}
                    >
                      Saved Receiving FFLs
                    </p>
                    {savedDestinationsLoading ? (
                      <p className="mt-2 text-sm text-muted-foreground">Loading saved FFLs…</p>
                    ) : savedFfls.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-3">
                        <Select
                          value={selectedFflId ?? "different"}
                          onValueChange={(value) => {
                            if (value === "different") {
                              clearForDifferentFflAddress();
                              return;
                            }

                            const dealer = savedFfls.find((entry) => entry.id === value);
                            if (dealer) {
                              applySavedFfl(dealer);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full rounded-none border-border/30 bg-surface-container px-3">
                            <SelectValue placeholder="Select a saved receiving FFL" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="different">Use Different Dealer</SelectItem>
                            {savedFfls.map((dealer) => (
                              <SelectItem key={dealer.id} value={dealer.id}>
                                {dealer.fflName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedFflId ? (
                          <div className="border border-primary/30 bg-primary/5 p-4">
                            {(() => {
                              const selected = savedFfls.find((dealer) => dealer.id === selectedFflId);
                              if (!selected) return null;

                              return (
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{selected.fflName}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {selected.contactName || "Saved dealer"}
                                    </p>
                                    {selected.address ? (
                                      <p className="text-sm text-muted-foreground">
                                        {selected.address.city}, {selected.address.state} {selected.address.postalCode}
                                      </p>
                                    ) : null}
                                  </div>
                                  <Check className="size-4 shrink-0 text-primary" />
                                </div>
                              );
                            })()}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No saved transfer dealers yet. You can keep filling the form manually or add one from your account.
                      </p>
                    )}
                  </div>
                ) : null}

                {isSignedIn && !selectedFflId ? (
                  <label className="mt-5 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={saveFflToAccount}
                      onChange={(event) => setSaveFflToAccount(event.target.checked)}
                      className="size-4 border-border/30"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Save this receiving FFL to my account
                    </span>
                  </label>
                ) : null}
              </section>
            )}

            <section className="bg-surface-container-low p-6">
              <div className="flex items-start gap-3 mb-4">
                <WalletCards className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p
                    className="font-display text-[10px] font-semibold uppercase text-primary"
                    style={{ letterSpacing: "0.16em" }}
                  >
                    Order Review
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review your delivery details, transfer dealer information, and order summary before continuing.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleReviewOrder()}
                  disabled={savingSelections}
                  className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 gap-2 text-xs"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {savingSelections ? "SAVING..." : "REVIEW ORDER"}
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-border/30 text-[10px] font-bold uppercase"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <Link href="/cart">
                    <ArrowLeft className="size-3.5" />
                    RETURN TO CART
                  </Link>
                </Button>
              </div>

              {saveMessage ? (
                <p className="mt-3 text-[11px] text-muted-foreground">{saveMessage}</p>
              ) : null}
              {!saveMessage && reviewMessage ? (
                <p className="mt-3 text-[11px] text-muted-foreground">{reviewMessage}</p>
              ) : null}
            </section>
              </>
            ) : (
              <section className="bg-surface-container-low p-6">
                <div className="flex items-start gap-3 mb-4">
                  <WalletCards className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p
                      className="font-display text-[10px] font-semibold uppercase text-primary"
                      style={{ letterSpacing: "0.16em" }}
                    >
                      Final Review
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confirm everything below before placing the order.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="bg-surface-container p-5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground/60" style={{ letterSpacing: "0.1em" }}>
                      Shipping
                    </p>
                    <p className="mt-2 text-sm text-foreground">{form.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{form.line1}{form.line2 ? `, ${form.line2}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{form.city}, {form.state} {form.postalCode}</p>
                    <p className="text-sm text-muted-foreground">{form.phone}</p>
                    <p className="text-sm text-muted-foreground">{form.email}</p>
                  </div>

                  {hasFfl ? (
                    <div className="bg-surface-container p-5">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground/60" style={{ letterSpacing: "0.1em" }}>
                        Receiving FFL
                      </p>
                      <p className="mt-2 text-sm text-foreground">{form.fflName}</p>
                      <p className="text-sm text-muted-foreground">{form.fflContact}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.fflLine1}{form.fflLine2 ? `, ${form.fflLine2}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {form.fflCity}, {form.fflState} {form.fflPostalCode}
                      </p>
                      {form.fflNumber ? <p className="text-sm text-muted-foreground">FFL #: {form.fflNumber}</p> : null}
                      {form.fflPhone ? <p className="text-sm text-muted-foreground">{form.fflPhone}</p> : null}
                      {form.fflEmail ? <p className="text-sm text-muted-foreground">{form.fflEmail}</p> : null}
                      {form.notes ? <p className="text-sm text-muted-foreground">{form.notes}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  <p
                    className="text-[10px] font-semibold uppercase text-muted-foreground/60"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    Line Items
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {items.map((item) => (
                      <div
                        key={`review-${item.slug}-${item.sku}-${item.color ?? ""}-${item.size ?? ""}`}
                        className="flex items-start justify-between gap-3 bg-surface-container px-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-[11px] font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase text-muted-foreground/50" style={{ letterSpacing: "0.08em" }}>
                            {item.sku} · QTY {item.quantity}
                          </p>
                          {(item.size || item.color) ? (
                            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                              {[item.size && `SIZE: ${item.size}`, item.color && `COLOR: ${item.color}`].filter(Boolean).join(" / ")}
                            </p>
                          ) : null}
                          {item.requiresFFL ? (
                            <p className="mt-1 text-[10px] uppercase text-primary" style={{ letterSpacing: "0.08em" }}>
                              FFL Transfer Required
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-none border-border/30 text-[10px] font-bold uppercase"
                    style={{ letterSpacing: "0.1em" }}
                    onClick={() => setShowReview(false)}
                  >
                    <ArrowLeft className="size-3.5" />
                    BACK TO DETAILS
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 gap-2 text-xs"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    PLACE ORDER
                    <Lock className="size-3.5" />
                  </Button>
                </div>

                {reviewMessage ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">{reviewMessage}</p>
                ) : null}
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-surface-container-high shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 flex flex-col gap-4">
              <p
                className="font-display text-[10px] font-semibold uppercase text-primary"
                style={{ letterSpacing: "0.18em" }}
              >
                ORDER REVIEW
              </p>

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={`${item.slug}-${item.sku}-${item.color ?? ""}-${item.size ?? ""}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-[11px] font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase text-muted-foreground/50" style={{ letterSpacing: "0.08em" }}>
                        {item.sku} · QTY {item.quantity}
                      </p>
                      {(item.size || item.color) ? (
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          {[item.size && `SIZE: ${item.size}`, item.color && `COLOR: ${item.color}`].filter(Boolean).join(" / ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="bg-border/20" />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span style={{ letterSpacing: "0.08em" }}>SUBTOTAL</span>
                  <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span style={{ letterSpacing: "0.08em" }}>SHIPPING</span>
                  <span>Calculated next</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span style={{ letterSpacing: "0.08em" }}>ESTIMATED TAX</span>
                  <span>{formatPrice(estimatedTax)}</span>
                </div>
                <Separator className="bg-border/20 my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold uppercase text-foreground" style={{ letterSpacing: "0.1em" }}>
                    CURRENT TOTAL
                  </span>
                  <span className="font-display text-lg font-bold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-surface-container p-3">
                <Lock className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your checkout details are secured with encrypted transmission.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
