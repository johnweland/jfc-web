"use client";

import { useState } from "react";
import {
  MapPin,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useAddresses,
  type ShippingAddress,
  type SavedFflDealer,
} from "@/lib/addresses/context";

// ─── Shared styled input ──────────────────────────────────────────────────────

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
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[10px] uppercase text-muted-foreground/60 font-semibold"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
        {optional && (
          <span className="ml-1 normal-case text-muted-foreground/40">(optional)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-b border-outline text-sm text-foreground placeholder:text-muted-foreground/30 py-1.5 focus:outline-none focus:border-primary transition-colors"
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
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={`size-4 shrink-0 flex items-center justify-center border transition-colors ${
          checked
            ? "bg-primary border-primary"
            : "bg-transparent border-outline group-hover:border-primary/60"
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="size-2.5 text-primary-foreground" />}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-[11px] text-muted-foreground" style={{ letterSpacing: "0.04em" }}>
        {label}
      </span>
    </label>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: typeof MapPin; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center bg-surface-container">
      <Icon className="size-8 text-muted-foreground/20" />
      <p className="text-[11px] uppercase text-muted-foreground/50" style={{ letterSpacing: "0.1em" }}>
        {message}
      </p>
    </div>
  );
}

// ─── Address card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetPrimary,
}: {
  address: ShippingAddress;
  onEdit: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}) {
  return (
    <div className="bg-surface-container-low p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          {address.isPrimary && (
            <span
              className="inline-flex items-center bg-surface-container-highest text-accent text-[9px] font-semibold uppercase px-2 py-0.5 mb-2"
              style={{ letterSpacing: "0.12em" }}
            >
              PRIMARY
            </span>
          )}
          <p className="font-display text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
            {address.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}, {address.state} {address.zip}
          </p>
          {address.phone && (
            <p className="text-xs text-muted-foreground mt-0.5">{address.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Edit address"
            className="flex size-7 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove address"
            className="flex size-7 items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      {!address.isPrimary && (
        <button
          onClick={onSetPrimary}
          className="self-start text-[10px] uppercase text-primary hover:text-accent transition-colors"
          style={{ letterSpacing: "0.08em" }}
        >
          Set as primary
        </button>
      )}
    </div>
  );
}

// ─── FFL dealer card ──────────────────────────────────────────────────────────

function FflCard({
  dealer,
  onEdit,
  onRemove,
  onSetPreferred,
}: {
  dealer: SavedFflDealer;
  onEdit: () => void;
  onRemove: () => void;
  onSetPreferred: () => void;
}) {
  return (
    <div className="bg-surface-container-low p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dealer.isPreferred && (
            <span
              className="inline-flex items-center gap-1 bg-surface-container-highest text-accent text-[9px] font-semibold uppercase px-2 py-0.5 mb-2"
              style={{ letterSpacing: "0.12em" }}
            >
              <ShieldCheck className="size-2.5" />
              PREFERRED
            </span>
          )}
          <p className="font-display text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.04em" }}>
            {dealer.dealerName}
          </p>
          {dealer.contactName && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Attn: {dealer.contactName}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {dealer.line1}
            {dealer.line2 && <>, {dealer.line2}</>}
            <br />
            {dealer.city}, {dealer.state} {dealer.zip}
          </p>
          {dealer.phone && (
            <p className="text-xs text-muted-foreground mt-0.5">{dealer.phone}</p>
          )}
          <span
            className="inline-block font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5 mt-2"
            style={{ letterSpacing: "0.06em" }}
          >
            FFL: {dealer.licenseNumber}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Edit FFL dealer"
            className="flex size-7 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove FFL dealer"
            className="flex size-7 items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      {!dealer.isPreferred && (
        <button
          onClick={onSetPreferred}
          className="self-start text-[10px] uppercase text-primary hover:text-accent transition-colors"
          style={{ letterSpacing: "0.08em" }}
        >
          Set as preferred
        </button>
      )}
    </div>
  );
}

// ─── Blank form state helpers ─────────────────────────────────────────────────

const blankShipping = (): Omit<ShippingAddress, "id"> => ({
  name: "", line1: "", line2: "", city: "", state: "", zip: "", phone: "", isPrimary: false,
});

const blankFfl = (): Omit<SavedFflDealer, "id"> => ({
  dealerName: "", licenseNumber: "", line1: "", line2: "",
  city: "", state: "", zip: "", phone: "", contactName: "", isPreferred: false,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const {
    shipping, addShipping, updateShipping, removeShipping, setPrimary,
    fflDealers, addFfl, updateFfl, removeFfl, setPreferred,
  } = useAddresses();

  // ── Shipping form state ──
  const [shippingFormOpen, setShippingFormOpen] = useState(false);
  const [editingShipping, setEditingShipping] = useState<ShippingAddress | null>(null);
  const [sForm, setSForm] = useState(blankShipping());

  function openAddShipping() {
    setEditingShipping(null);
    setSForm(blankShipping());
    setShippingFormOpen(true);
  }

  function openEditShipping(addr: ShippingAddress) {
    setEditingShipping(addr);
    setSForm({ name: addr.name, line1: addr.line1, line2: addr.line2 ?? "",
      city: addr.city, state: addr.state, zip: addr.zip,
      phone: addr.phone ?? "", isPrimary: addr.isPrimary });
    setShippingFormOpen(true);
  }

  function saveShipping() {
    if (!sForm.name || !sForm.line1 || !sForm.city || !sForm.state || !sForm.zip) return;
    if (editingShipping) {
      updateShipping({ ...sForm, id: editingShipping.id });
    } else {
      addShipping(sForm);
    }
    setShippingFormOpen(false);
    setEditingShipping(null);
  }

  // ── FFL form state ──
  const [fflFormOpen, setFflFormOpen] = useState(false);
  const [editingFfl, setEditingFfl] = useState<SavedFflDealer | null>(null);
  const [fForm, setFForm] = useState(blankFfl());

  function openAddFfl() {
    setEditingFfl(null);
    setFForm(blankFfl());
    setFflFormOpen(true);
  }

  function openEditFfl(dealer: SavedFflDealer) {
    setEditingFfl(dealer);
    setFForm({
      dealerName: dealer.dealerName, licenseNumber: dealer.licenseNumber,
      line1: dealer.line1, line2: dealer.line2 ?? "",
      city: dealer.city, state: dealer.state, zip: dealer.zip,
      phone: dealer.phone ?? "", contactName: dealer.contactName ?? "",
      isPreferred: dealer.isPreferred,
    });
    setFflFormOpen(true);
  }

  function saveFfl() {
    if (!fForm.dealerName || !fForm.licenseNumber || !fForm.line1 || !fForm.city || !fForm.state || !fForm.zip) return;
    if (editingFfl) {
      updateFfl({ ...fForm, id: editingFfl.id });
    } else {
      addFfl(fForm);
    }
    setFflFormOpen(false);
    setEditingFfl(null);
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Page header */}
      <div>
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
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
      </div>

      {/* ── SHIPPING ADDRESSES ─────────────────────────────────── */}
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
            {shipping.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50">
                ({shipping.length})
              </span>
            )}
          </div>
          {!shippingFormOpen && (
            <Button
              size="sm"
              onClick={openAddShipping}
              className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-1.5 h-8"
              style={{ letterSpacing: "0.1em" }}
            >
              <Plus className="size-3" />
              ADD ADDRESS
            </Button>
          )}
        </div>

        {/* Inline add/edit form */}
        {shippingFormOpen && (
          <div className="bg-surface-container p-5 flex flex-col gap-5">
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary"
              style={{ letterSpacing: "0.18em" }}
            >
              {editingShipping ? "EDIT ADDRESS" : "NEW SHIPPING ADDRESS"}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full Name" id="s-name" value={sForm.name}
                  onChange={(v) => setSForm((f) => ({ ...f, name: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address Line 1" id="s-line1" value={sForm.line1}
                  onChange={(v) => setSForm((f) => ({ ...f, line1: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address Line 2" id="s-line2" value={sForm.line2 ?? ""} optional
                  onChange={(v) => setSForm((f) => ({ ...f, line2: v }))} />
              </div>
              <Field label="City" id="s-city" value={sForm.city}
                onChange={(v) => setSForm((f) => ({ ...f, city: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="State" id="s-state" value={sForm.state} placeholder="MN"
                  onChange={(v) => setSForm((f) => ({ ...f, state: v.toUpperCase().slice(0, 2) }))} />
                <Field label="ZIP" id="s-zip" value={sForm.zip}
                  onChange={(v) => setSForm((f) => ({ ...f, zip: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Phone" id="s-phone" value={sForm.phone ?? ""} optional
                  type="tel" onChange={(v) => setSForm((f) => ({ ...f, phone: v }))} />
              </div>
              <div className="sm:col-span-2">
                <CheckboxField id="s-primary" label="Set as primary shipping address"
                  checked={sForm.isPrimary}
                  onChange={(v) => setSForm((f) => ({ ...f, isPrimary: v }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={saveShipping}
                disabled={!sForm.name || !sForm.line1 || !sForm.city || !sForm.state || !sForm.zip}
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-2 h-9 disabled:opacity-40"
                style={{ letterSpacing: "0.1em" }}
              >
                <Check className="size-3.5" />
                SAVE ADDRESS
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShippingFormOpen(false); setEditingShipping(null); }}
                className="rounded-none uppercase font-bold text-muted-foreground hover:text-foreground text-[10px] gap-2 h-9"
                style={{ letterSpacing: "0.1em" }}
              >
                <X className="size-3.5" />
                CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Cards */}
        {shipping.length === 0 && !shippingFormOpen
          ? <EmptyState icon={MapPin} message="No shipping addresses saved" />
          : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shipping.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={() => openEditShipping(addr)}
                  onRemove={() => removeShipping(addr.id)}
                  onSetPrimary={() => setPrimary(addr.id)}
                />
              ))}
            </div>
          )
        }
      </section>

      <Separator className="bg-border/20" />

      {/* ── FFL DEALERS ───────────────────────────────────────── */}
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
            {fflDealers.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50">
                ({fflDealers.length})
              </span>
            )}
          </div>
          {!fflFormOpen && (
            <Button
              size="sm"
              onClick={openAddFfl}
              className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-1.5 h-8"
              style={{ letterSpacing: "0.1em" }}
            >
              <Plus className="size-3" />
              ADD DEALER
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Save your preferred FFL dealers here. During checkout you can select one to receive your firearm transfer, or add a new one.
        </p>

        {/* Inline add/edit form */}
        {fflFormOpen && (
          <div className="bg-surface-container p-5 flex flex-col gap-5">
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary"
              style={{ letterSpacing: "0.18em" }}
            >
              {editingFfl ? "EDIT FFL DEALER" : "NEW FFL DEALER"}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Dealer / Store Name" id="f-name" value={fForm.dealerName}
                  onChange={(v) => setFForm((f) => ({ ...f, dealerName: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="FFL License Number" id="f-license" value={fForm.licenseNumber}
                  placeholder="e.g. 07-23-XXX-01-7B-XXXXX"
                  onChange={(v) => setFForm((f) => ({ ...f, licenseNumber: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address Line 1" id="f-line1" value={fForm.line1}
                  onChange={(v) => setFForm((f) => ({ ...f, line1: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address Line 2" id="f-line2" value={fForm.line2 ?? ""} optional
                  onChange={(v) => setFForm((f) => ({ ...f, line2: v }))} />
              </div>
              <Field label="City" id="f-city" value={fForm.city}
                onChange={(v) => setFForm((f) => ({ ...f, city: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="State" id="f-state" value={fForm.state} placeholder="MN"
                  onChange={(v) => setFForm((f) => ({ ...f, state: v.toUpperCase().slice(0, 2) }))} />
                <Field label="ZIP" id="f-zip" value={fForm.zip}
                  onChange={(v) => setFForm((f) => ({ ...f, zip: v }))} />
              </div>
              <Field label="Phone" id="f-phone" value={fForm.phone ?? ""} optional type="tel"
                onChange={(v) => setFForm((f) => ({ ...f, phone: v }))} />
              <Field label="Contact Name" id="f-contact" value={fForm.contactName ?? ""} optional
                placeholder="e.g. Mike R."
                onChange={(v) => setFForm((f) => ({ ...f, contactName: v }))} />
              <div className="sm:col-span-2">
                <CheckboxField id="f-preferred" label="Set as preferred FFL dealer"
                  checked={fForm.isPreferred}
                  onChange={(v) => setFForm((f) => ({ ...f, isPreferred: v }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={saveFfl}
                disabled={!fForm.dealerName || !fForm.licenseNumber || !fForm.line1 || !fForm.city || !fForm.state || !fForm.zip}
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-2 h-9 disabled:opacity-40"
                style={{ letterSpacing: "0.1em" }}
              >
                <Check className="size-3.5" />
                SAVE DEALER
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setFflFormOpen(false); setEditingFfl(null); }}
                className="rounded-none uppercase font-bold text-muted-foreground hover:text-foreground text-[10px] gap-2 h-9"
                style={{ letterSpacing: "0.1em" }}
              >
                <X className="size-3.5" />
                CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Cards */}
        {fflDealers.length === 0 && !fflFormOpen
          ? <EmptyState icon={ShieldCheck} message="No FFL dealers saved" />
          : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fflDealers.map((dealer) => (
                <FflCard
                  key={dealer.id}
                  dealer={dealer}
                  onEdit={() => openEditFfl(dealer)}
                  onRemove={() => removeFfl(dealer.id)}
                  onSetPreferred={() => setPreferred(dealer.id)}
                />
              ))}
            </div>
          )
        }
      </section>
    </div>
  );
}
