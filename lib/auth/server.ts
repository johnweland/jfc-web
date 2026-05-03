import "server-only";

import { cache } from "react";
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { fetchUserAttributes } from "aws-amplify/auth/server";
import { getCurrentUser } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  cognitoRegion,
  isAmplifyAuthConfigured,
  runWithAmplifyServerContext,
} from "@/lib/auth/amplify-server";
import {
  type AccountUserState,
  type AuthMfaMethod,
  type AuthMfaState,
  type AuthUserState,
  getDisplayName,
  getInitials,
  getUserRole,
  normalizeGroups,
  requiresMfaSetup,
  hasStaffAccess,
} from "@/lib/auth/shared";

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function mapMfaMethod(method: string): AuthMfaMethod | null {
  switch (method) {
    case "EMAIL_OTP":
      return "EMAIL";
    case "SMS_MFA":
      return "SMS";
    case "SOFTWARE_TOKEN_MFA":
      return "TOTP";
    default:
      return null;
  }
}

async function getServerMfaState(accessToken: string | undefined): Promise<AuthMfaState> {
  if (!accessToken || !cognitoRegion) {
    return {
      enabled: false,
      enabledMethods: [],
      hasTotp: false,
      preferredMethod: null,
    };
  }

  try {
    const client = new CognitoIdentityProviderClient({
      region: cognitoRegion,
    });
    const response = await client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      })
    );

    // Cognito stores a user's enabled MFA methods on GetUser.
    const enabledMethods = (response.UserMFASettingList ?? [])
      .map(mapMfaMethod)
      .filter((method): method is AuthMfaMethod => Boolean(method));
    const preferredMethod = response.PreferredMfaSetting
      ? mapMfaMethod(response.PreferredMfaSetting)
      : null;

    return {
      enabled: enabledMethods.length > 0,
      enabledMethods,
      hasTotp: enabledMethods.includes("TOTP"),
      preferredMethod,
    };
  } catch (error) {
    console.error("Unable to read Cognito MFA state", error);

    return {
      enabled: false,
      enabledMethods: [],
      hasTotp: false,
      preferredMethod: null,
    };
  }
}

export const getServerAuthState = cache(async (): Promise<AuthUserState | null> => {
  if (!isAmplifyAuthConfigured) {
    return null;
  }

  try {
    const [currentUser, session] = await Promise.all([
      runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: (contextSpec) => getCurrentUser(contextSpec),
      }),
      runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: (contextSpec) => fetchAuthSession(contextSpec),
      }),
    ]);

    const idTokenPayload = session.tokens?.idToken?.payload ?? {};
    const accessTokenPayload = session.tokens?.accessToken?.payload ?? {};

    // Cognito group membership is exposed through the `cognito:groups` token claim.
    const groups = normalizeGroups(
      accessTokenPayload["cognito:groups"] ?? idTokenPayload["cognito:groups"]
    );
    const email =
      asString(idTokenPayload.email) ??
      currentUser.signInDetails?.loginId ??
      null;
    const cognitoSub =
      asString(idTokenPayload.sub) ??
      asString(accessTokenPayload.sub) ??
      currentUser.userId ??
      null;
    const username =
      asString(idTokenPayload["cognito:username"]) ?? currentUser.username ?? null;
    const mfa = await getServerMfaState(session.tokens?.accessToken?.toString());
    const role = getUserRole({ groups });

    return {
      cognitoSub,
      email,
      groups,
      isSignedIn: true,
      mfa,
      role,
      username,
    };
  } catch {
    return null;
  }
});

export const getServerAccountUser = cache(async (): Promise<AccountUserState | null> => {
  const authState = await getServerAuthState();

  if (!authState) {
    return null;
  }

  try {
    const attributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchUserAttributes(contextSpec),
    });

    const givenName = asString(attributes.given_name);
    const familyName = asString(attributes.family_name);
    const displayName = getDisplayName({
      email: authState.email,
      familyName,
      givenName,
      name: asString(attributes.name),
      preferredUsername: asString(attributes.preferred_username),
      username: authState.username,
    });

    return {
      ...authState,
      displayName,
      emailVerified: attributes.email_verified === "true",
      familyName,
      givenName,
      initials: getInitials(displayName),
    };
  } catch {
    const displayName = getDisplayName({
      email: authState.email,
      username: authState.username,
    });

    return {
      ...authState,
      displayName,
      emailVerified: false,
      familyName: null,
      givenName: null,
      initials: getInitials(displayName),
    };
  }
});

export async function requireSignedIn(redirectTo = "/account") {
  const accountUser = await getServerAccountUser();

  if (!accountUser?.isSignedIn) {
    redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return accountUser;
}

export async function requireAdmin(options?: {
  allowMissingMfa?: boolean;
  redirectTo?: string;
}) {
  if (process.env.E2E_TEST_MODE === "1") {
    const e2eAuthState: AuthUserState = {
      cognitoSub: "e2e-admin",
      email: "e2e-admin@example.com",
      groups: ["ADMINS"],
      isSignedIn: true,
      mfa: {
        enabled: true,
        enabledMethods: ["TOTP"],
        hasTotp: true,
        preferredMethod: "TOTP",
      },
      role: "admin",
      username: "e2e-admin",
    }

    return e2eAuthState
  }

  const redirectTo = options?.redirectTo ?? "/admin";
  const authState = await getServerAuthState();

  if (!authState?.isSignedIn) {
    redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
  }

  if (!hasStaffAccess(authState)) {
    redirect("/access-denied");
  }

  if (!options?.allowMissingMfa && requiresMfaSetup(authState)) {
    redirect("/admin/setup-mfa");
  }

  return authState;
}
