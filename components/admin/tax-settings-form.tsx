"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAX_SETTINGS_ID, asPercent } from "@/lib/tax/shared";

const client = generateClient<Schema>();
const ADMIN_AUTH_MODE = "userPool" as const;

type TaxFormState = {
  defaultRate: string;
  firearmRate: string;
  partRate: string;
  accessoryRate: string;
  apparelRate: string;
  otherRate: string;
};

const EMPTY_FORM: TaxFormState = {
  defaultRate: "0",
  firearmRate: "",
  partRate: "",
  accessoryRate: "",
  apparelRate: "",
  otherRate: "",
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

function RateField({
  id,
  label,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper: string;
}) {
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
        className="h-9 font-mono"
      />
      <p className="text-xs text-muted-foreground">{helper}</p>
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

    void client.models.TaxSettings.get(
      { id: TAX_SETTINGS_ID },
      { authMode: ADMIN_AUTH_MODE },
    )
      .then(({ data, errors }) => {
        if (errors?.length) {
          throw new Error(errors[0].message);
        }

        if (!cancelled && data) {
          setForm({
            defaultRate: String(data.defaultRate ?? 0),
            firearmRate: toInputValue(data.firearmRate),
            partRate: toInputValue(data.partRate),
            accessoryRate: toInputValue(data.accessoryRate),
            apparelRate: toInputValue(data.apparelRate),
            otherRate: toInputValue(data.otherRate),
          });
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
    const defaultRate = parseOptionalRate(form.defaultRate) ?? 0;
    return {
      defaultRate,
      firearmRate: parseOptionalRate(form.firearmRate),
      partRate: parseOptionalRate(form.partRate),
      accessoryRate: parseOptionalRate(form.accessoryRate),
      apparelRate: parseOptionalRate(form.apparelRate),
      otherRate: parseOptionalRate(form.otherRate),
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
      defaultRate: parseOptionalRate(form.defaultRate) ?? 0,
      firearmRate: parseOptionalRate(form.firearmRate),
      partRate: parseOptionalRate(form.partRate),
      accessoryRate: parseOptionalRate(form.accessoryRate),
      apparelRate: parseOptionalRate(form.apparelRate),
      otherRate: parseOptionalRate(form.otherRate),
    };

    try {
      const existing = await client.models.TaxSettings.get(
        { id: TAX_SETTINGS_ID },
        { authMode: ADMIN_AUTH_MODE },
      );

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
            Default Tax
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <RateField
            id="defaultRate"
            label="Default Rate (%)"
            value={form.defaultRate}
            onChange={(value) => update("defaultRate", value)}
            helper="Used when an item is set to DEFAULT, or when no category override is present."
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
          <RateField id="firearmRate" label="Firearm" value={form.firearmRate} onChange={(value) => update("firearmRate", value)} helper="Leave blank to fall back to the default rate." />
          <RateField id="partRate" label="Part" value={form.partRate} onChange={(value) => update("partRate", value)} helper="Leave blank to fall back to the default rate." />
          <RateField id="accessoryRate" label="Accessory" value={form.accessoryRate} onChange={(value) => update("accessoryRate", value)} helper="Leave blank to fall back to the default rate." />
          <RateField id="apparelRate" label="Apparel" value={form.apparelRate} onChange={(value) => update("apparelRate", value)} helper="Leave blank to fall back to the default rate." />
          <RateField id="otherRate" label="Other" value={form.otherRate} onChange={(value) => update("otherRate", value)} helper="Leave blank to fall back to the default rate." />
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
            <p>Default: <span className="font-mono text-foreground">{asPercent(preview.defaultRate)}</span></p>
            <p>Firearm: <span className="font-mono text-foreground">{preview.firearmRate == null ? "DEFAULT" : asPercent(preview.firearmRate)}</span></p>
            <p>Part: <span className="font-mono text-foreground">{preview.partRate == null ? "DEFAULT" : asPercent(preview.partRate)}</span></p>
            <p>Accessory: <span className="font-mono text-foreground">{preview.accessoryRate == null ? "DEFAULT" : asPercent(preview.accessoryRate)}</span></p>
            <p>Apparel: <span className="font-mono text-foreground">{preview.apparelRate == null ? "DEFAULT" : asPercent(preview.apparelRate)}</span></p>
            <p>Other: <span className="font-mono text-foreground">{preview.otherRate == null ? "DEFAULT" : asPercent(preview.otherRate)}</span></p>
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
