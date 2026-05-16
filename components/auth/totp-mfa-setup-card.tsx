"use client";

import { useEffect, useState, useTransition } from "react";
import {
  setUpTOTP,
  updateMFAPreference,
  verifyTOTPSetup,
} from "aws-amplify/auth";
import {
  CheckCircle2,
  Copy,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TotpMfaSetupCard({
  buttonLabel = "Verify and continue",
  description = "Set up an authenticator app to add an extra layer of protection to your account.",
  email,
  redirectTo,
  title = "Set Up Authenticator App",
}: {
  buttonLabel?: string;
  description?: string;
  email: string | null;
  redirectTo: string;
  title?: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [sharedSecret, setSharedSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadSecret() {
      try {
        const setupDetails = await setUpTOTP();
        const nextProvisioningUri = setupDetails
          .getSetupUri("Jackson Firearm Co", email ?? undefined)
          .toString();
        const { toDataURL } = await import("qrcode");
        const nextQrCodeDataUrl = await toDataURL(nextProvisioningUri, {
          color: {
            dark: "#e2e2e2",
            light: "#131313",
          },
          errorCorrectionLevel: "M",
          margin: 1,
          width: 224,
        });

        if (cancelled) {
          return;
        }

        setSharedSecret(setupDetails.sharedSecret);
        setProvisioningUri(nextProvisioningUri);
        setQrCodeDataUrl(nextQrCodeDataUrl);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to initialize authenticator setup."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSecret(false);
        }
      }
    }

    void loadSecret();

    return () => {
      cancelled = true;
    };
  }, [email]);

  function copySecret() {
    if (!sharedSecret) {
      return;
    }

    void navigator.clipboard.writeText(sharedSecret);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await verifyTOTPSetup({ code: mfaCode });
        await updateMFAPreference({
          totp: "PREFERRED",
        });

        router.replace(redirectTo);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to verify the authenticator code."
        );
      }
    });
  }

  return (
    <Card className="w-full rounded-none border-0 bg-surface-container-low shadow-none ring-0">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck data-icon="inline-start" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Smartphone data-icon="inline-start" />
              1. Add the account to your authenticator app
            </div>
            <p className="text-sm text-muted-foreground">
              Use 1Password, Google Authenticator, Authy, or another TOTP app.
            </p>
            {qrCodeDataUrl ? (
              <div className="mt-4 flex flex-col items-start gap-3">
                <Image
                  alt="Authenticator app setup QR code"
                  className="size-48 border border-border/60 bg-background p-2"
                  height={192}
                  src={qrCodeDataUrl}
                  unoptimized
                  width={192}
                />
                <Button asChild className="w-full sm:w-auto" variant="outline">
                  <a href={provisioningUri ?? undefined}>
                    <Smartphone data-icon="inline-start" />
                    Open setup link
                  </a>
                </Button>
              </div>
            ) : isLoadingSecret ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
                Generating QR code...
              </div>
            ) : null}
            {provisioningUri ? (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Setup URI
                </p>
                <code className="overflow-x-auto rounded-lg border border-border/60 bg-background p-3 text-xs text-foreground">
                  {provisioningUri}
                </code>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 data-icon="inline-start" />
              2. Enter the secret manually if needed
            </div>
            {isLoadingSecret ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
                Preparing your authenticator secret...
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <code className="rounded-lg border border-border/60 bg-background p-3 text-sm text-foreground">
                  {sharedSecret ?? "Unavailable"}
                </code>
                <Button
                  disabled={!sharedSecret}
                  onClick={copySecret}
                  type="button"
                  variant="outline"
                >
                  <Copy data-icon="inline-start" />
                  Copy secret
                </Button>
              </div>
            )}
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="totp-code">
              3. Verify the 6-digit code
            </label>
            <Input
              autoComplete="one-time-code"
              id="totp-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setMfaCode(event.target.value)}
              placeholder="123456"
              value={mfaCode}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <Button disabled={isPending || isLoadingSecret || !sharedSecret} type="submit">
            {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
