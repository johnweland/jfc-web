"use client";

import { useState, useTransition } from "react";
import {
  confirmSignIn,
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signUp,
} from "aws-amplify/auth";
import {
  AlertTriangle,
  KeyRound,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "sign-in" | "sign-up" | "confirm-sign-up" | "confirm-sign-in-mfa";

export function AuthPanel({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetFeedback() {
    setErrorMessage(null);
    setMessage(null);
  }

  function handleSuccess() {
    router.replace(redirectTo);
    router.refresh();
  }

  function handleUnsupportedSignInStep(step: string) {
    setErrorMessage(
      `This sign-in flow returned ${step}. Add that handler before enabling the flow in production.`
    );
  }

  function submitSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        const result = await signIn({
          username: email,
          password,
        });

        switch (result.nextStep.signInStep) {
          case "DONE":
            handleSuccess();
            break;
          case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
          case "CONFIRM_SIGN_IN_WITH_EMAIL_CODE":
          case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
            setMode("confirm-sign-in-mfa");
            setMessage("Enter the verification code to complete sign-in.");
            break;
          case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION":
            await confirmSignIn({ challengeResponse: "TOTP" });
            setMode("confirm-sign-in-mfa");
            setMessage("Enter the authenticator code to complete sign-in.");
            break;
          case "CONFIRM_SIGN_UP":
            setMode("confirm-sign-up");
            setMessage("Confirm your email address before signing in.");
            break;
          default:
            handleUnsupportedSignInStep(result.nextStep.signInStep);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
      }
    });
  }

  function submitSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        const fullName = [givenName.trim(), familyName.trim()].filter(Boolean).join(" ");
        const result = await signUp({
          password,
          username: email,
          options: {
            userAttributes: {
              email,
              family_name: familyName.trim(),
              given_name: givenName.trim(),
              name: fullName || undefined,
            },
          },
        });

        switch (result.nextStep.signUpStep) {
          case "DONE":
            setMode("sign-in");
            setMessage("Account created. Sign in to continue.");
            break;
          case "CONFIRM_SIGN_UP":
            setMode("confirm-sign-up");
            setMessage("We sent a confirmation code to your email.");
            break;
          default:
            setErrorMessage(
              `This sign-up flow returned ${result.nextStep.signUpStep}. Add that handler before enabling the flow in production.`
            );
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
      }
    });
  }

  function submitConfirmSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        await confirmSignUp({
          confirmationCode: confirmCode,
          username: email,
        });
        setMode("sign-in");
        setMessage("Email confirmed. Sign in with your new account.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to confirm sign up."
        );
      }
    });
  }

  function resendCode() {
    resetFeedback();

    startTransition(async () => {
      try {
        await resendSignUpCode({ username: email });
        setMessage("A fresh confirmation code has been sent.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to resend the code."
        );
      }
    });
  }

  function submitSignInVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      try {
        const result = await confirmSignIn({
          challengeResponse: confirmCode,
        });

        if (result.nextStep.signInStep === "DONE") {
          handleSuccess();
          return;
        }

        handleUnsupportedSignInStep(result.nextStep.signInStep);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to verify the sign-in code."
        );
      }
    });
  }

  const feedback = errorMessage ? (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle data-icon="inline-start" />
      <span>{errorMessage}</span>
    </div>
  ) : message ? (
    <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
      <MailCheck data-icon="inline-start" />
      <span>{message}</span>
    </div>
  ) : null;

  return (
    <Card className="mx-auto w-full max-w-xl border-border/60 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck data-icon="inline-start" />
          <CardTitle>Account Access</CardTitle>
        </div>
        <CardDescription>
          Sign in or create an account from the same endpoint. Staff and admins
          still use the shared customer pool.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mode === "confirm-sign-up" ? (
          <form className="flex flex-col gap-4" onSubmit={submitConfirmSignUp}>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <MailCheck className="mt-0.5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Enter the confirmation code sent to <span className="text-foreground">{email}</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="confirm-code">
                Confirmation code
              </label>
              <Input
                autoComplete="one-time-code"
                id="confirm-code"
                onChange={(event) => setConfirmCode(event.target.value)}
                placeholder="123456"
                value={confirmCode}
              />
            </div>

            {feedback}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button disabled={isPending} type="submit">
                {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                Confirm account
              </Button>
              <Button disabled={isPending} onClick={resendCode} type="button" variant="outline">
                Resend code
              </Button>
            </div>
          </form>
        ) : mode === "confirm-sign-in-mfa" ? (
          <form className="flex flex-col gap-4" onSubmit={submitSignInVerification}>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <KeyRound className="mt-0.5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Enter the verification code from your authenticator, email, or SMS challenge.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="signin-code">
                Verification code
              </label>
              <Input
                autoComplete="one-time-code"
                id="signin-code"
                onChange={(event) => setConfirmCode(event.target.value)}
                placeholder="123456"
                value={confirmCode}
              />
            </div>

            {feedback}

            <Button disabled={isPending} type="submit">
              {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              Verify and continue
            </Button>
          </form>
        ) : (
          <Tabs
            className="gap-4"
            onValueChange={(value) => {
              resetFeedback();
              setMode(value as AuthMode);
            }}
            value={mode}
          >
            <TabsList className="w-full" variant="default">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="sign-up">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in">
              <form className="flex flex-col gap-4" onSubmit={submitSignIn}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="signin-email">
                    Email
                  </label>
                  <Input
                    autoComplete="email"
                    id="signin-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="signin-password">
                    Password
                  </label>
                  <Input
                    autoComplete="current-password"
                    id="signin-password"
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    value={password}
                  />
                </div>

                {feedback}

                <Button disabled={isPending} type="submit">
                  {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sign-up">
              <form className="flex flex-col gap-4" onSubmit={submitSignUp}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="given-name">
                      First name
                    </label>
                    <Input
                      autoComplete="given-name"
                      id="given-name"
                      onChange={(event) => setGivenName(event.target.value)}
                      value={givenName}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="family-name">
                      Last name
                    </label>
                    <Input
                      autoComplete="family-name"
                      id="family-name"
                      onChange={(event) => setFamilyName(event.target.value)}
                      value={familyName}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
                    Email
                  </label>
                  <Input
                    autoComplete="email"
                    id="signup-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="signup-password">
                    Password
                  </label>
                  <Input
                    autoComplete="new-password"
                    id="signup-password"
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    value={password}
                  />
                </div>

                {feedback}

                <Button disabled={isPending} type="submit">
                  {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                  <UserRoundPlus data-icon="inline-start" />
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
