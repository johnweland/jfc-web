"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MapPin, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CustomerAddressRecord = Schema["CustomerAddress"]["type"];
type CustomerFflLocationRecord = Schema["CustomerFflLocation"]["type"];

type CustomerIdentity = {
  customerId: string;
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string;
};

type ShippingFormState = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type FflFormState = {
  fflName: string;
  fflNumber: string;
  contactName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  isDefault: boolean;
};

function blankShipping(): ShippingFormState {
  return {
    label: "",
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  };
}

function blankFfl(): FflFormState {
  return {
    fflName: "",
    fflNumber: "",
    contactName: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    notes: "",
    isDefault: false,
  };
}

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

function optionalString(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function formatCountry(country: string | null | undefined) {
  if (!country) {
    return "";
  }

  if (country.toUpperCase() === "US") {
    return "United States";
  }

  return country;
}

async function ensureCustomerProfile(
  client: ReturnType<typeof generateClient<Schema>>,
  customer: CustomerIdentity,
  defaults?: {
    defaultShippingAddressId?: string | null;
    defaultFflLocationId?: string | null;
  }
) {
  const existing = await client.models.CustomerProfile.get({
    customerId: customer.customerId,
  });

  if (existing.data) {
    await client.models.CustomerProfile.update({
      customerId: customer.customerId,
      defaultShippingAddressId:
        defaults?.defaultShippingAddressId ?? existing.data.defaultShippingAddressId ?? null,
      defaultFflLocationId:
        defaults?.defaultFflLocationId ?? existing.data.defaultFflLocationId ?? null,
      email: customer.email,
      firstName: optionalString(customer.firstName),
      lastName: optionalString(customer.lastName),
      phone: existing.data.phone ?? null,
    });

    return;
  }

  await client.models.CustomerProfile.create({
    customerId: customer.customerId,
    cognitoSub: customer.cognitoSub,
    email: customer.email,
    firstName: optionalString(customer.firstName),
    lastName: optionalString(customer.lastName),
    defaultShippingAddressId: defaults?.defaultShippingAddressId ?? null,
    defaultFflLocationId: defaults?.defaultFflLocationId ?? null,
  });
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  optional,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase text-muted-foreground/60"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
        {optional ? (
          <span className="ml-1 normal-case text-muted-foreground/40">(optional)</span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-b border-outline bg-transparent py-1.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/30 focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="group flex cursor-pointer items-center gap-2.5">
      <div
        className={`flex size-4 shrink-0 items-center justify-center border transition-colors ${
          checked
            ? "border-primary bg-primary"
            : "border-outline bg-transparent group-hover:border-primary/60"
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked ? <Check className="size-2.5 text-primary-foreground" /> : null}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span className="text-[11px] text-muted-foreground" style={{ letterSpacing: "0.04em" }}>
        {label}
      </span>
    </label>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof MapPin;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-surface-container py-12 text-center">
      <Icon className="size-8 text-muted-foreground/20" />
      <p className="text-[11px] uppercase text-muted-foreground/50" style={{ letterSpacing: "0.1em" }}>
        {message}
      </p>
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetDefault,
  disabled,
}: {
  address: CustomerAddressRecord;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
  disabled: boolean;
}) {
  const recipientName = address.recipientName?.trim() || "Saved shipping address";
  const label = address.label?.trim();

  return (
    <div className="flex flex-col gap-3 bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {address.isDefault ? (
            <span
              className="mb-2 inline-flex items-center bg-surface-container-highest px-2 py-0.5 text-[9px] font-semibold uppercase text-accent"
              style={{ letterSpacing: "0.12em" }}
            >
              DEFAULT
            </span>
          ) : null}
          <p className="font-display text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
            {recipientName}
          </p>
          {label ? (
            <p className="mt-0.5 text-[10px] uppercase text-muted-foreground/50" style={{ letterSpacing: "0.08em" }}>
              {label}
            </p>
          ) : null}
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {address.line1}
            {address.line2 ? <>, {address.line2}</> : null}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {formatCountry(address.country)}
          </p>
          {address.phone ? <p className="mt-0.5 text-xs text-muted-foreground">{address.phone}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            disabled={disabled}
            aria-label="Edit address"
            className="flex size-7 items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove address"
            className="flex size-7 items-center justify-center text-muted-foreground/50 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      {!address.isDefault ? (
        <button
          onClick={onSetDefault}
          disabled={disabled}
          className="self-start text-[10px] uppercase text-primary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          style={{ letterSpacing: "0.08em" }}
        >
          Set as default
        </button>
      ) : null}
    </div>
  );
}

function FflCard({
  dealer,
  onEdit,
  onRemove,
  onSetDefault,
  disabled,
}: {
  dealer: CustomerFflLocationRecord;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dealer.isDefault ? (
            <span
              className="mb-2 inline-flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 text-[9px] font-semibold uppercase text-accent"
              style={{ letterSpacing: "0.12em" }}
            >
              <ShieldCheck className="size-2.5" />
              DEFAULT
            </span>
          ) : null}
          <p className="font-display text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
            {dealer.fflName}
          </p>
          {dealer.contactName ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">Attn: {dealer.contactName}</p>
          ) : null}
          {dealer.address ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {dealer.address.line1}
              {dealer.address.line2 ? <>, {dealer.address.line2}</> : null}
              <br />
              {dealer.address.city}, {dealer.address.state} {dealer.address.postalCode}
              <br />
              {formatCountry(dealer.address.country)}
            </p>
          ) : null}
          {dealer.phone ? <p className="mt-0.5 text-xs text-muted-foreground">{dealer.phone}</p> : null}
          {dealer.email ? <p className="mt-0.5 text-xs text-muted-foreground">{dealer.email}</p> : null}
          {dealer.fflNumber ? (
            <span
              className="mt-2 inline-block bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-primary"
              style={{ letterSpacing: "0.06em" }}
            >
              FFL: {dealer.fflNumber}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            disabled={disabled}
            aria-label="Edit FFL dealer"
            className="flex size-7 items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove FFL dealer"
            className="flex size-7 items-center justify-center text-muted-foreground/50 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      {!dealer.isDefault ? (
        <button
          onClick={onSetDefault}
          disabled={disabled}
          className="self-start text-[10px] uppercase text-primary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          style={{ letterSpacing: "0.08em" }}
        >
          Set as default
        </button>
      ) : null}
    </div>
  );
}

export function AddressBook({ customer }: { customer: CustomerIdentity }) {
  const client = useMemo(() => generateClient<Schema>(), []);
  const [shipping, setShipping] = useState<CustomerAddressRecord[]>([]);
  const [fflDealers, setFflDealers] = useState<CustomerFflLocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [shippingFormOpen, setShippingFormOpen] = useState(false);
  const [editingShipping, setEditingShipping] = useState<CustomerAddressRecord | null>(null);
  const [shippingForm, setShippingForm] = useState<ShippingFormState>(blankShipping());

  const [fflFormOpen, setFflFormOpen] = useState(false);
  const [editingFfl, setEditingFfl] = useState<CustomerFflLocationRecord | null>(null);
  const [fflForm, setFflForm] = useState<FflFormState>(blankFfl());

  const loadRecords = useCallback(async () => {
    if (!customer.customerId) {
      setErrorMessage("Unable to resolve your account identity for saved addresses.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [{ data: addressData }, { data: fflData }] = await Promise.all([
        client.models.CustomerAddress.list({
          filter: { customerId: { eq: customer.customerId } },
        }),
        client.models.CustomerFflLocation.list({
          filter: { customerId: { eq: customer.customerId } },
        }),
      ]);

      setShipping(sortShipping(addressData));
      setFflDealers(sortFflLocations(fflData));
    } catch (error) {
      console.error("Unable to load saved addresses", error);
      setErrorMessage("We couldn't load your saved addresses right now.");
    } finally {
      setIsLoading(false);
    }
  }, [customer.customerId]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function runMutation(action: () => Promise<void>) {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      await action();
      await loadRecords();
    } catch (error) {
      console.error("Address book update failed", error);
      setErrorMessage("We couldn't save that change. Please try again.");
    } finally {
      setIsMutating(false);
    }
  }

  function openAddShipping() {
    setEditingShipping(null);
    setShippingForm(blankShipping());
    setShippingFormOpen(true);
  }

  function openEditShipping(address: CustomerAddressRecord) {
    setEditingShipping(address);
    setShippingForm({
      label: address.label ?? "",
      recipientName: address.recipientName ?? "",
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault ?? false,
    });
    setShippingFormOpen(true);
  }

  async function saveShipping() {
    const shouldBeDefault =
      shipping.length === 0 ||
      shippingForm.isDefault ||
      Boolean(editingShipping?.isDefault && !shippingForm.isDefault);
    const currentDefault = shipping.find((address) => address.isDefault);

    await runMutation(async () => {
      if (shouldBeDefault && currentDefault && currentDefault.id !== editingShipping?.id) {
        await client.models.CustomerAddress.update({
          id: currentDefault.id,
          isDefault: false,
        });
      }

      const payload = {
        customerId: customer.customerId,
        label: optionalString(shippingForm.label),
        recipientName: optionalString(shippingForm.recipientName),
        phone: optionalString(shippingForm.phone),
        line1: shippingForm.line1.trim(),
        line2: optionalString(shippingForm.line2),
        city: shippingForm.city.trim(),
        state: shippingForm.state.trim().toUpperCase().slice(0, 2),
        postalCode: shippingForm.postalCode.trim(),
        country: shippingForm.country.trim().toUpperCase() || "US",
        isDefault: shouldBeDefault,
      };

      const result = editingShipping
        ? await client.models.CustomerAddress.update({
            id: editingShipping.id,
            ...payload,
          })
        : await client.models.CustomerAddress.create(payload);

      const defaultShippingAddressId =
        shouldBeDefault && result.data?.id
          ? result.data.id
          : currentDefault?.id ?? null;

      await ensureCustomerProfile(client, customer, {
        defaultShippingAddressId,
      });

      setShippingFormOpen(false);
      setEditingShipping(null);
      setShippingForm(blankShipping());
    });
  }

  async function removeShipping(id: string) {
    await runMutation(async () => {
      const target = shipping.find((address) => address.id === id);
      const fallback = shipping.find((address) => address.id !== id) ?? null;

      await client.models.CustomerAddress.delete({ id });

      if (target?.isDefault && fallback?.id) {
        await client.models.CustomerAddress.update({
          id: fallback.id,
          isDefault: true,
        });
      }

      await ensureCustomerProfile(client, customer, {
        defaultShippingAddressId: target?.isDefault ? fallback?.id ?? null : undefined,
      });
    });
  }

  async function setDefaultShipping(id: string) {
    await runMutation(async () => {
      const currentDefault = shipping.find((address) => address.isDefault);

      if (currentDefault && currentDefault.id !== id) {
        await client.models.CustomerAddress.update({
          id: currentDefault.id,
          isDefault: false,
        });
      }

      await client.models.CustomerAddress.update({
        id,
        isDefault: true,
      });

      await ensureCustomerProfile(client, customer, {
        defaultShippingAddressId: id,
      });
    });
  }

  function openAddFfl() {
    setEditingFfl(null);
    setFflForm(blankFfl());
    setFflFormOpen(true);
  }

  function openEditFfl(dealer: CustomerFflLocationRecord) {
    setEditingFfl(dealer);
    setFflForm({
      fflName: dealer.fflName,
      fflNumber: dealer.fflNumber ?? "",
      contactName: dealer.contactName ?? "",
      phone: dealer.phone ?? "",
      email: dealer.email ?? "",
      line1: dealer.address?.line1 ?? "",
      line2: dealer.address?.line2 ?? "",
      city: dealer.address?.city ?? "",
      state: dealer.address?.state ?? "",
      postalCode: dealer.address?.postalCode ?? "",
      country: dealer.address?.country ?? "US",
      notes: dealer.notes ?? "",
      isDefault: dealer.isDefault ?? false,
    });
    setFflFormOpen(true);
  }

  async function saveFfl() {
    const shouldBeDefault =
      fflDealers.length === 0 ||
      fflForm.isDefault ||
      Boolean(editingFfl?.isDefault && !fflForm.isDefault);
    const currentDefault = fflDealers.find((dealer) => dealer.isDefault);

    await runMutation(async () => {
      if (shouldBeDefault && currentDefault && currentDefault.id !== editingFfl?.id) {
        await client.models.CustomerFflLocation.update({
          id: currentDefault.id,
          isDefault: false,
        });
      }

      const payload = {
        customerId: customer.customerId,
        fflName: fflForm.fflName.trim(),
        fflNumber: optionalString(fflForm.fflNumber),
        contactName: optionalString(fflForm.contactName),
        phone: optionalString(fflForm.phone),
        email: optionalString(fflForm.email),
        address: {
          line1: fflForm.line1.trim(),
          line2: optionalString(fflForm.line2),
          city: fflForm.city.trim(),
          state: fflForm.state.trim().toUpperCase().slice(0, 2),
          postalCode: fflForm.postalCode.trim(),
          country: fflForm.country.trim().toUpperCase() || "US",
          recipientName: optionalString(fflForm.contactName),
          phone: optionalString(fflForm.phone),
        },
        isDefault: shouldBeDefault,
        notes: optionalString(fflForm.notes),
      };

      const result = editingFfl
        ? await client.models.CustomerFflLocation.update({
            id: editingFfl.id,
            ...payload,
          })
        : await client.models.CustomerFflLocation.create(payload);

      const defaultFflLocationId =
        shouldBeDefault && result.data?.id ? result.data.id : currentDefault?.id ?? null;

      await ensureCustomerProfile(client, customer, {
        defaultFflLocationId,
      });

      setFflFormOpen(false);
      setEditingFfl(null);
      setFflForm(blankFfl());
    });
  }

  async function removeFfl(id: string) {
    await runMutation(async () => {
      const target = fflDealers.find((dealer) => dealer.id === id);
      const fallback = fflDealers.find((dealer) => dealer.id !== id) ?? null;

      await client.models.CustomerFflLocation.delete({ id });

      if (target?.isDefault && fallback?.id) {
        await client.models.CustomerFflLocation.update({
          id: fallback.id,
          isDefault: true,
        });
      }

      await ensureCustomerProfile(client, customer, {
        defaultFflLocationId: target?.isDefault ? fallback?.id ?? null : undefined,
      });
    });
  }

  async function setDefaultFfl(id: string) {
    await runMutation(async () => {
      const currentDefault = fflDealers.find((dealer) => dealer.isDefault);

      if (currentDefault && currentDefault.id !== id) {
        await client.models.CustomerFflLocation.update({
          id: currentDefault.id,
          isDefault: false,
        });
      }

      await client.models.CustomerFflLocation.update({
        id,
        isDefault: true,
      });

      await ensureCustomerProfile(client, customer, {
        defaultFflLocationId: id,
      });
    });
  }

  const shippingValid =
    shippingForm.line1.trim() &&
    shippingForm.city.trim() &&
    shippingForm.state.trim() &&
    shippingForm.postalCode.trim() &&
    shippingForm.country.trim();
  const fflValid =
    fflForm.fflName.trim() &&
    fflForm.line1.trim() &&
    fflForm.city.trim() &&
    fflForm.state.trim() &&
    fflForm.postalCode.trim() &&
    fflForm.country.trim();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p
          className="mb-1 font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          OPERATOR PORTAL
        </p>
        <h2
          className="font-display text-2xl font-bold uppercase text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          ADDRESSES & FFL DEALERS
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Save shipping destinations and preferred transfer dealers to speed up checkout.
        </p>
      </div>

      {errorMessage ? (
        <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <h3
              className="font-display text-[11px] font-bold uppercase text-foreground"
              style={{ letterSpacing: "0.12em" }}
            >
              SHIPPING ADDRESSES
            </h3>
            {shipping.length > 0 ? (
              <span className="text-[10px] text-muted-foreground/50">({shipping.length})</span>
            ) : null}
          </div>
          {!shippingFormOpen ? (
            <Button
              size="sm"
              onClick={openAddShipping}
              disabled={isLoading || isMutating}
              className="gradient-primary h-8 gap-1.5 rounded-none border-0 text-[10px] font-bold uppercase text-primary-foreground"
              style={{ letterSpacing: "0.1em" }}
            >
              <Plus className="size-3" />
              ADD ADDRESS
            </Button>
          ) : null}
        </div>

        {shippingFormOpen ? (
          <div className="flex flex-col gap-5 bg-surface-container p-5">
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary"
              style={{ letterSpacing: "0.18em" }}
            >
              {editingShipping ? "EDIT ADDRESS" : "NEW SHIPPING ADDRESS"}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Label"
                id="s-label"
                value={shippingForm.label}
                optional
                placeholder="Home, Office, Hunting Cabin"
                onChange={(value) => setShippingForm((current) => ({ ...current, label: value }))}
              />
              <Field
                label="Recipient Name"
                id="s-recipient"
                value={shippingForm.recipientName}
                optional
                placeholder="Full name"
                onChange={(value) =>
                  setShippingForm((current) => ({ ...current, recipientName: value }))
                }
              />
              <div className="sm:col-span-2">
                <Field
                  label="Address Line 1"
                  id="s-line1"
                  value={shippingForm.line1}
                  onChange={(value) => setShippingForm((current) => ({ ...current, line1: value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Address Line 2"
                  id="s-line2"
                  value={shippingForm.line2}
                  optional
                  onChange={(value) => setShippingForm((current) => ({ ...current, line2: value }))}
                />
              </div>
              <Field
                label="City"
                id="s-city"
                value={shippingForm.city}
                onChange={(value) => setShippingForm((current) => ({ ...current, city: value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="State"
                  id="s-state"
                  value={shippingForm.state}
                  placeholder="MN"
                  onChange={(value) =>
                    setShippingForm((current) => ({
                      ...current,
                      state: value.toUpperCase().slice(0, 2),
                    }))
                  }
                />
                <Field
                  label="ZIP"
                  id="s-zip"
                  value={shippingForm.postalCode}
                  onChange={(value) =>
                    setShippingForm((current) => ({ ...current, postalCode: value }))
                  }
                />
              </div>
              <Field
                label="Country"
                id="s-country"
                value={shippingForm.country}
                placeholder="US"
                onChange={(value) => setShippingForm((current) => ({ ...current, country: value }))}
              />
              <Field
                label="Phone"
                id="s-phone"
                value={shippingForm.phone}
                optional
                type="tel"
                onChange={(value) => setShippingForm((current) => ({ ...current, phone: value }))}
              />
              <div className="sm:col-span-2">
                <CheckboxField
                  id="s-default"
                  label="Set as default shipping address"
                  checked={shippingForm.isDefault || shipping.length === 0}
                  onChange={(value) =>
                    setShippingForm((current) => ({ ...current, isDefault: value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => void saveShipping()}
                disabled={!shippingValid || isMutating}
                className="gradient-primary h-9 gap-2 rounded-none border-0 text-[10px] font-bold uppercase text-primary-foreground disabled:opacity-40"
                style={{ letterSpacing: "0.1em" }}
              >
                <Check className="size-3.5" />
                SAVE ADDRESS
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShippingFormOpen(false);
                  setEditingShipping(null);
                  setShippingForm(blankShipping());
                }}
                disabled={isMutating}
                className="h-9 gap-2 rounded-none text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
                style={{ letterSpacing: "0.1em" }}
              >
                <X className="size-3.5" />
                CANCEL
              </Button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <EmptyState icon={MapPin} message="Loading saved shipping addresses" />
        ) : shipping.length === 0 && !shippingFormOpen ? (
          <EmptyState icon={MapPin} message="No shipping addresses saved" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shipping.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                disabled={isMutating}
                onEdit={() => openEditShipping(address)}
                onRemove={() => void removeShipping(address.id)}
                onSetDefault={() => void setDefaultShipping(address.id)}
              />
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-border/20" />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h3
              className="font-display text-[11px] font-bold uppercase text-foreground"
              style={{ letterSpacing: "0.12em" }}
            >
              FFL DEALERS
            </h3>
            {fflDealers.length > 0 ? (
              <span className="text-[10px] text-muted-foreground/50">({fflDealers.length})</span>
            ) : null}
          </div>
          {!fflFormOpen ? (
            <Button
              size="sm"
              onClick={openAddFfl}
              disabled={isLoading || isMutating}
              className="gradient-primary h-8 gap-1.5 rounded-none border-0 text-[10px] font-bold uppercase text-primary-foreground"
              style={{ letterSpacing: "0.1em" }}
            >
              <Plus className="size-3" />
              ADD DEALER
            </Button>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Save the transfer locations you use most often. You can choose one during checkout for firearm orders.
        </p>

        {fflFormOpen ? (
          <div className="flex flex-col gap-5 bg-surface-container p-5">
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary"
              style={{ letterSpacing: "0.18em" }}
            >
              {editingFfl ? "EDIT FFL DEALER" : "NEW FFL DEALER"}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Dealer / Store Name"
                  id="f-name"
                  value={fflForm.fflName}
                  onChange={(value) => setFflForm((current) => ({ ...current, fflName: value }))}
                />
              </div>
              <Field
                label="FFL License Number"
                id="f-license"
                value={fflForm.fflNumber}
                optional
                placeholder="07-23-XXX-01-7B-XXXXX"
                onChange={(value) => setFflForm((current) => ({ ...current, fflNumber: value }))}
              />
              <Field
                label="Contact Name"
                id="f-contact"
                value={fflForm.contactName}
                optional
                onChange={(value) =>
                  setFflForm((current) => ({ ...current, contactName: value }))
                }
              />
              <div className="sm:col-span-2">
                <Field
                  label="Address Line 1"
                  id="f-line1"
                  value={fflForm.line1}
                  onChange={(value) => setFflForm((current) => ({ ...current, line1: value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Address Line 2"
                  id="f-line2"
                  value={fflForm.line2}
                  optional
                  onChange={(value) => setFflForm((current) => ({ ...current, line2: value }))}
                />
              </div>
              <Field
                label="City"
                id="f-city"
                value={fflForm.city}
                onChange={(value) => setFflForm((current) => ({ ...current, city: value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="State"
                  id="f-state"
                  value={fflForm.state}
                  placeholder="MN"
                  onChange={(value) =>
                    setFflForm((current) => ({
                      ...current,
                      state: value.toUpperCase().slice(0, 2),
                    }))
                  }
                />
                <Field
                  label="ZIP"
                  id="f-zip"
                  value={fflForm.postalCode}
                  onChange={(value) => setFflForm((current) => ({ ...current, postalCode: value }))}
                />
              </div>
              <Field
                label="Country"
                id="f-country"
                value={fflForm.country}
                placeholder="US"
                onChange={(value) => setFflForm((current) => ({ ...current, country: value }))}
              />
              <Field
                label="Phone"
                id="f-phone"
                value={fflForm.phone}
                optional
                type="tel"
                onChange={(value) => setFflForm((current) => ({ ...current, phone: value }))}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Email"
                  id="f-email"
                  value={fflForm.email}
                  optional
                  type="email"
                  onChange={(value) => setFflForm((current) => ({ ...current, email: value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Notes"
                  id="f-notes"
                  value={fflForm.notes}
                  optional
                  placeholder="Transfer instructions, store hours, contact notes"
                  onChange={(value) => setFflForm((current) => ({ ...current, notes: value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <CheckboxField
                  id="f-default"
                  label="Set as default FFL dealer"
                  checked={fflForm.isDefault || fflDealers.length === 0}
                  onChange={(value) => setFflForm((current) => ({ ...current, isDefault: value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => void saveFfl()}
                disabled={!fflValid || isMutating}
                className="gradient-primary h-9 gap-2 rounded-none border-0 text-[10px] font-bold uppercase text-primary-foreground disabled:opacity-40"
                style={{ letterSpacing: "0.1em" }}
              >
                <Check className="size-3.5" />
                SAVE DEALER
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setFflFormOpen(false);
                  setEditingFfl(null);
                  setFflForm(blankFfl());
                }}
                disabled={isMutating}
                className="h-9 gap-2 rounded-none text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
                style={{ letterSpacing: "0.1em" }}
              >
                <X className="size-3.5" />
                CANCEL
              </Button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <EmptyState icon={ShieldCheck} message="Loading saved FFL dealers" />
        ) : fflDealers.length === 0 && !fflFormOpen ? (
          <EmptyState icon={ShieldCheck} message="No FFL dealers saved" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fflDealers.map((dealer) => (
              <FflCard
                key={dealer.id}
                dealer={dealer}
                disabled={isMutating}
                onEdit={() => openEditFfl(dealer)}
                onRemove={() => void removeFfl(dealer.id)}
                onSetDefault={() => void setDefaultFfl(dealer.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
