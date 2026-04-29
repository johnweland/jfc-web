"use client";

import { useState, useTransition } from "react";
import {
  confirmUserAttribute,
  resendSignUpCode,
  sendUserAttributeVerificationCode,
  updateUserAttributes,
} from "aws-amplify/auth";
import { CheckCircle2, LoaderCircle, MailCheck, Pencil, UserRound } from "lucide-react";
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
import type { AccountUserState } from "@/lib/auth/shared";

export function ProfileEditor({ user }: { user: AccountUserState }) {
  const router = useRouter();
  const [email, setEmail] = useState(user.email ?? "");
  const [givenName, setGivenName] = useState(user.givenName ?? "");
  const [familyName, setFamilyName] = useState(user.familyName ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(
    !user.emailVerified && Boolean(user.email)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetFeedback() {
    setErrorMessage(null);
    setMessage(null);
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        const nextEmail = email.trim();
        const nextGivenName = givenName.trim();
        const nextFamilyName = familyName.trim();
        const fullName = [nextGivenName, nextFamilyName].filter(Boolean).join(" ");

        const result = await updateUserAttributes({
          userAttributes: {
            email: nextEmail,
            family_name: nextFamilyName,
            given_name: nextGivenName,
            name: fullName,
          },
        });

        const emailUpdateStep = result.email?.nextStep.updateAttributeStep;
        const needsConfirmation = emailUpdateStep === "CONFIRM_ATTRIBUTE_WITH_CODE";

        setPendingEmailConfirmation(needsConfirmation);
        setIsEditing(false);
        setMessage(
          needsConfirmation
            ? "Profile saved. Confirm your new email address to finish the update."
            : "Profile updated successfully."
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to update your profile."
        );
      }
    });
  }

  function confirmEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        await confirmUserAttribute({
          userAttributeKey: "email",
          confirmationCode: verificationCode,
        });
        setPendingEmailConfirmation(false);
        setVerificationCode("");
        setMessage("Email address confirmed.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to confirm your email address."
        );
      }
    });
  }

  function resendEmailCode() {
    resetFeedback();

    startTransition(async () => {
      try {
        await sendUserAttributeVerificationCode({ userAttributeKey: "email" });
        setMessage("A new confirmation code has been sent.");
      } catch {
        try {
          await resendSignUpCode({ username: email.trim() });
          setMessage("A new confirmation code has been sent.");
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to resend the confirmation code."
          );
        }
      }
    });
  }

  return (
    <Card className="rounded-none border-0 bg-surface-container-low shadow-none ring-0">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <UserRound data-icon="inline-start" />
          <CardTitle>Profile Details</CardTitle>
        </div>
        <CardDescription>
          Keep your name and contact email up to date for order updates and account notices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isEditing ? (
          <form className="flex flex-col gap-4" onSubmit={saveProfile}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="account-given-name">
                  First name
                </label>
                <Input
                  autoComplete="given-name"
                  id="account-given-name"
                  onChange={(event) => setGivenName(event.target.value)}
                  value={givenName}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="account-family-name">
                  Last name
                </label>
                <Input
                  autoComplete="family-name"
                  id="account-family-name"
                  onChange={(event) => setFamilyName(event.target.value)}
                  value={familyName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="account-email">
                Email address
              </label>
              <Input
                autoComplete="email"
                id="account-email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : message ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button disabled={isPending} type="submit">
                {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                Save changes
              </Button>
              <Button
                disabled={isPending}
                onClick={() => {
                  setGivenName(user.givenName ?? "");
                  setFamilyName(user.familyName ?? "");
                  setEmail(user.email ?? "");
                  resetFeedback();
                  setIsEditing(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  Name
                </p>
                <p className="mt-1 text-sm text-foreground">{user.displayName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  Email
                </p>
                <p className="mt-1 text-sm text-foreground">{user.email ?? "No email on file"}</p>
              </div>
            </div>

            <Button
              className="w-fit rounded-none text-[10px] font-bold uppercase"
              onClick={() => {
                resetFeedback();
                setIsEditing(true);
              }}
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit profile
            </Button>
          </div>
        )}

        {pendingEmailConfirmation ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Confirm your email address</p>
                <p className="text-sm text-muted-foreground">
                  Enter the confirmation code sent to {email}.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={confirmEmail}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email-confirmation-code">
                  Confirmation code
                </label>
                <Input
                  autoComplete="one-time-code"
                  id="email-confirmation-code"
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="123456"
                  value={verificationCode}
                />
              </div>

              {errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : message ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button disabled={isPending} type="submit">
                  {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                  <CheckCircle2 data-icon="inline-start" />
                  Confirm email
                </Button>
                <Button disabled={isPending} onClick={resendEmailCode} type="button" variant="outline">
                  Resend code
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
