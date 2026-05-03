"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAX_SETTINGS_ID, asPercent, getDefaultTaxRate } from "@/lib/tax/shared";

const client = generateClient<Schema>();
const ADMIN_AUTH_MODE = "userPool" as const;
const LEGACY_TAX_SETTINGS_SELECTION = [
  "id",
  "defaultRate",
  "firearmRate",
  "partRate",
  "accessoryRate",
  "apparelRate",
  "otherRate",
] as const;

type TaxFormState = {
  stateRate: string;
  localRate: string;
  firearmRate: string;
  firearmExempt: boolean;
  partRate: string;
  partExempt: boolean;
  accessoryRate: string;
  accessoryExempt: boolean;
  apparelRate: string;
  apparelExempt: boolean;
  otherRate: string;
  otherExempt: boolean;
  serviceRate: string;
  serviceExempt: boolean;
  ammunitionRate: string;
  ammunitionExempt: boolean;
};

const EMPTY_FORM: TaxFormState = {
  stateRate: "0",
  localRate: "0",
  firearmRate: "",
  firearmExempt: false,
  partRate: "",
  partExempt: false,
  accessoryRate: "",
  accessoryExempt: false,
  apparelRate: "",
  apparelExempt: false,
  otherRate: "",
  otherExempt: false,
  serviceRate: "",
  serviceExempt: false,
  ammunitionRate: "",
  ammunitionExempt: false,
};

type LegacyTaxSettingsRecord = {
  id: string;
  defaultRate?: number | null;
  firearmRate?: number | null;
  partRate?: number | null;
  accessoryRate?: number | null;
  apparelRate?: number | null;
  otherRate?: number | null;
  serviceRate?: number | null;
  ammunitionRate?: number | null;
};

function toInputValue(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "";
}

function parseOptionalRate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasLegacyTaxFieldReadError(
  errors: readonly { message: string }[] | undefined,
) {
  return Boolean(
    errors?.some(
      (error) =>
        error.message.includes("/getTaxSettings/stateRate") ||
        error.message.includes("/getTaxSettings/localRate") ||
        error.message.includes("/getTaxSettings/firearmExempt") ||
        error.message.includes("/getTaxSettings/partExempt") ||
        error.message.includes("/getTaxSettings/accessoryExempt") ||
        error.message.includes("/getTaxSettings/apparelExempt") ||
        error.message.includes("/getTaxSettings/otherExempt") ||
        error.message.includes("/getTaxSettings/serviceExempt") ||
        error.message.includes("/getTaxSettings/ammunitionExempt"),
    ),
  );
}

function applyTaxSettingsToForm(
  record:
    | Schema["TaxSettings"]["type"]
    | LegacyTaxSettingsRecord,
  setForm: React.Dispatch<React.SetStateAction<TaxFormState>>,
) {
  const stateRate = "stateRate" in record
    ? record.stateRate ?? record.defaultRate ?? 0
    : record.defaultRate ?? 0;
  const localRate = "localRate" in record ? record.localRate ?? 0 : 0;

  setForm({
    stateRate: String(stateRate),
    localRate: String(localRate),
    firearmRate: toInputValue(record.firearmRate),
    firearmExempt: "firearmExempt" in record ? record.firearmExempt ?? false : false,
    partRate: toInputValue(record.partRate),
    partExempt: "partExempt" in record ? record.partExempt ?? false : false,
    accessoryRate: toInputValue(record.accessoryRate),
    accessoryExempt: "accessoryExempt" in record ? record.accessoryExempt ?? false : false,
    apparelRate: toInputValue(record.apparelRate),
    apparelExempt: "apparelExempt" in record ? record.apparelExempt ?? false : false,
    otherRate: toInputValue(record.otherRate),
    otherExempt: "otherExempt" in record ? record.otherExempt ?? false : false,
    serviceRate: toInputValue(record.serviceRate),
    serviceExempt: "serviceExempt" in record ? record.serviceExempt ?? false : false,
    ammunitionRate: toInputValue(record.ammunitionRate),
    ammunitionExempt: "ammunitionExempt" in record ? record.ammunitionExempt ?? false : false,
  });
}

async function getTaxSettingsRecord() {
  const primary = await client.models.TaxSettings.get(
    { id: TAX_SETTINGS_ID },
    { authMode: ADMIN_AUTH_MODE },
  );

  if (!hasLegacyTaxFieldReadError(primary.errors)) {
    if (primary.errors?.length) {
      throw new Error(primary.errors[0].message);
    }

    return {
      data: primary.data,
      usedLegacyFallback: false,
    };
  }

  const legacy = await client.models.TaxSettings.get(
    { id: TAX_SETTINGS_ID },
    {
      authMode: ADMIN_AUTH_MODE,
      selectionSet: LEGACY_TAX_SETTINGS_SELECTION,
    },
  );

  if (legacy.errors?.length) {
    throw new Error(legacy.errors[0].message);
  }

  return {
    data: legacy.data as LegacyTaxSettingsRecord | null,
    usedLegacyFallback: true,
  };
}

function RateField(
  {
    id,
    label,
    value,
    onChange,
    helper,
    disabled = false,
    placeholder,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    helper: string;
    disabled?: boolean;
    placeholder?: string;
  },
) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase text-muted-foreground"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.001"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-9 font-mono"
      />
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function CategoryTaxField({
  rateId,
  exemptId,
  label,
  rateValue,
  exempt,
  onRateChange,
  onExemptChange,
}: {
  rateId: string;
  exemptId: string;
  label: string;
  rateValue: string;
  exempt: boolean;
  onRateChange: (value: string) => void;
  onExemptChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 p-4">
      <RateField
        id={rateId}
        label={label}
        value={rateValue}
        onChange={onRateChange}
        disabled={exempt}
        placeholder={exempt ? "Ignored while exempt" : "Leave blank to use store default"}
        helper={
          exempt
            ? "This category will charge no tax when an item uses CATEGORY tax behavior."
            : "Leave blank to use the combined store default, or enter an override for this category."
        }
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id={exemptId}
          checked={exempt}
          onCheckedChange={(checked) => onExemptChange(checked === true)}
        />
        <Label htmlFor={exemptId} className="text-xs font-medium text-foreground">
          Mark {label.toLowerCase()} as tax exempt
        </Label>
      </div>
    </div>
  );
}

export function TaxSettingsForm() {
  const [form, setForm] = useState<TaxFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getTaxSettingsRecord()
      .then(({ data }) => {
        if (!cancelled && data) {
          applyTaxSettingsToForm(data, setForm);
        }
      })
      .catch((error) => {
        console.error("[tax-settings] load failed", error);
        if (!cancelled) {
          setMessage("Unable to load saved tax settings. You can still enter new values and save.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const preview = useMemo(() => {
    const stateRate = parseOptionalRate(form.stateRate) ?? 0;
    const localRate = parseOptionalRate(form.localRate) ?? 0;
    const defaultRate = getDefaultTaxRate(stateRate, localRate);
    return {
      stateRate,
      localRate,
      defaultRate,
      firearmRate: parseOptionalRate(form.firearmRate),
      firearmExempt: form.firearmExempt,
      partRate: parseOptionalRate(form.partRate),
      partExempt: form.partExempt,
      accessoryRate: parseOptionalRate(form.accessoryRate),
      accessoryExempt: form.accessoryExempt,
      apparelRate: parseOptionalRate(form.apparelRate),
      apparelExempt: form.apparelExempt,
      otherRate: parseOptionalRate(form.otherRate),
      otherExempt: form.otherExempt,
      serviceRate: parseOptionalRate(form.serviceRate),
      serviceExempt: form.serviceExempt,
      ammunitionRate: parseOptionalRate(form.ammunitionRate),
      ammunitionExempt: form.ammunitionExempt,
    };
  }, [form]);

  function update<K extends keyof TaxFormState>(key: K, value: TaxFormState[K]) {
    setMessage(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      id: TAX_SETTINGS_ID,
      stateRate: parseOptionalRate(form.stateRate) ?? 0,
      localRate: parseOptionalRate(form.localRate) ?? 0,
      defaultRate: getDefaultTaxRate(
        parseOptionalRate(form.stateRate) ?? 0,
        parseOptionalRate(form.localRate) ?? 0,
      ),
      firearmRate: parseOptionalRate(form.firearmRate),
      firearmExempt: form.firearmExempt,
      partRate: parseOptionalRate(form.partRate),
      partExempt: form.partExempt,
      accessoryRate: parseOptionalRate(form.accessoryRate),
      accessoryExempt: form.accessoryExempt,
      apparelRate: parseOptionalRate(form.apparelRate),
      apparelExempt: form.apparelExempt,
      otherRate: parseOptionalRate(form.otherRate),
      otherExempt: form.otherExempt,
      serviceRate: parseOptionalRate(form.serviceRate),
      serviceExempt: form.serviceExempt,
      ammunitionRate: parseOptionalRate(form.ammunitionRate),
      ammunitionExempt: form.ammunitionExempt,
    };

    try {
      const existing = await getTaxSettingsRecord();

      if (existing.data) {
        const { errors } = await client.models.TaxSettings.update(payload, {
          authMode: ADMIN_AUTH_MODE,
        });
        if (errors?.length) throw new Error(errors[0].message);
      } else {
        const { errors } = await client.models.TaxSettings.create(payload, {
          authMode: ADMIN_AUTH_MODE,
        });
        if (errors?.length) throw new Error(errors[0].message);
      }

      setMessage("Tax settings saved.");
    } catch (error) {
      console.error("[tax-settings] save failed", error);
      setMessage(error instanceof Error ? error.message : "Unable to save tax settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle
            className="text-sm font-semibold uppercase text-foreground"
            style={{ letterSpacing: "0.1em" }}
          >
            Store Default Tax
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <RateField
            id="stateRate"
            label="State Tax (%)"
            value={form.stateRate}
            onChange={(value) => update("stateRate", value)}
            helper="Base state tax applied to the storefront default."
          />
          <RateField
            id="localRate"
            label="Local Tax (%)"
            value={form.localRate}
            onChange={(value) => update("localRate", value)}
            helper="Additional county/city/local tax added on top of the state tax."
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle
            className="text-sm font-semibold uppercase text-foreground"
            style={{ letterSpacing: "0.1em" }}
          >
            Category Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <CategoryTaxField
            rateId="firearmRate"
            exemptId="firearmExempt"
            label="Firearm"
            rateValue={form.firearmRate}
            exempt={form.firearmExempt}
            onRateChange={(value) => update("firearmRate", value)}
            onExemptChange={(value) => update("firearmExempt", value)}
          />
          <CategoryTaxField
            rateId="partRate"
            exemptId="partExempt"
            label="Part"
            rateValue={form.partRate}
            exempt={form.partExempt}
            onRateChange={(value) => update("partRate", value)}
            onExemptChange={(value) => update("partExempt", value)}
          />
          <CategoryTaxField
            rateId="accessoryRate"
            exemptId="accessoryExempt"
            label="Accessory"
            rateValue={form.accessoryRate}
            exempt={form.accessoryExempt}
            onRateChange={(value) => update("accessoryRate", value)}
            onExemptChange={(value) => update("accessoryExempt", value)}
          />
          <CategoryTaxField
            rateId="apparelRate"
            exemptId="apparelExempt"
            label="Apparel"
            rateValue={form.apparelRate}
            exempt={form.apparelExempt}
            onRateChange={(value) => update("apparelRate", value)}
            onExemptChange={(value) => update("apparelExempt", value)}
          />
          <CategoryTaxField
            rateId="otherRate"
            exemptId="otherExempt"
            label="Other"
            rateValue={form.otherRate}
            exempt={form.otherExempt}
            onRateChange={(value) => update("otherRate", value)}
            onExemptChange={(value) => update("otherExempt", value)}
          />
          <CategoryTaxField
            rateId="serviceRate"
            exemptId="serviceExempt"
            label="Services"
            rateValue={form.serviceRate}
            exempt={form.serviceExempt}
            onRateChange={(value) => update("serviceRate", value)}
            onExemptChange={(value) => update("serviceExempt", value)}
          />
          <CategoryTaxField
            rateId="ammunitionRate"
            exemptId="ammunitionExempt"
            label="Ammunition"
            rateValue={form.ammunitionRate}
            exempt={form.ammunitionExempt}
            onRateChange={(value) => update("ammunitionRate", value)}
            onExemptChange={(value) => update("ammunitionExempt", value)}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle
            className="text-sm font-semibold uppercase text-foreground"
            style={{ letterSpacing: "0.1em" }}
          >
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <div className="grid gap-3 sm:grid-cols-2">
            <p>State: <span className="font-mono text-foreground">{asPercent(preview.stateRate)}</span></p>
            <p>Local: <span className="font-mono text-foreground">{asPercent(preview.localRate)}</span></p>
            <p>Combined Default: <span className="font-mono text-foreground">{asPercent(preview.defaultRate)}</span></p>
            <p>Firearm: <span className="font-mono text-foreground">{preview.firearmExempt ? "EXEMPT" : preview.firearmRate == null ? "DEFAULT" : asPercent(preview.firearmRate)}</span></p>
            <p>Part: <span className="font-mono text-foreground">{preview.partExempt ? "EXEMPT" : preview.partRate == null ? "DEFAULT" : asPercent(preview.partRate)}</span></p>
            <p>Accessory: <span className="font-mono text-foreground">{preview.accessoryExempt ? "EXEMPT" : preview.accessoryRate == null ? "DEFAULT" : asPercent(preview.accessoryRate)}</span></p>
            <p>Apparel: <span className="font-mono text-foreground">{preview.apparelExempt ? "EXEMPT" : preview.apparelRate == null ? "DEFAULT" : asPercent(preview.apparelRate)}</span></p>
            <p>Other: <span className="font-mono text-foreground">{preview.otherExempt ? "EXEMPT" : preview.otherRate == null ? "DEFAULT" : asPercent(preview.otherRate)}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading || saving}
          className="gradient-primary text-primary-foreground font-semibold uppercase text-xs"
          style={{ letterSpacing: "0.1em" }}
        >
          {saving ? "SAVING..." : "SAVE TAX SETTINGS"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
