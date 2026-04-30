import {
  fetchAuthSession,
  fetchMFAPreference,
  getCurrentUser,
} from "aws-amplify/auth";
import {
  type AuthMfaMethod,
  type AuthUserState,
  getUserRole,
  normalizeGroups,
} from "@/lib/auth/shared";

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function getClientAuthState(): Promise<AuthUserState | null> {
  try {
    const [currentUser, session, mfaPreference] = await Promise.all([
      getCurrentUser(),
      fetchAuthSession(),
      fetchMFAPreference(),
    ]);

    const idTokenPayload = session.tokens?.idToken?.payload ?? {};
    const accessTokenPayload = session.tokens?.accessToken?.payload ?? {};

    // Cognito group membership is exposed through the `cognito:groups` token claim.
    const groups = normalizeGroups(
      accessTokenPayload["cognito:groups"] ?? idTokenPayload["cognito:groups"]
    );
    const role = getUserRole({ groups });
    const cognitoSub =
      asString(idTokenPayload.sub) ??
      asString(accessTokenPayload.sub) ??
      currentUser.userId ??
      null;
    // Client-side MFA state comes from Cognito's MFA preference APIs.
    const enabledMethods = (mfaPreference.enabled ?? []) as AuthMfaMethod[];
    const preferredMethod = (mfaPreference.preferred ?? null) as AuthMfaMethod | null;

    return {
      cognitoSub,
      email:
        asString(idTokenPayload.email) ??
        currentUser.signInDetails?.loginId ??
        null,
      groups,
      isSignedIn: true,
      mfa: {
        enabled: enabledMethods.length > 0,
        enabledMethods,
        hasTotp: enabledMethods.includes("TOTP"),
        preferredMethod,
      },
      role,
      username:
        asString(idTokenPayload["cognito:username"]) ?? currentUser.username ?? null,
    };
  } catch {
    return null;
  }
}
