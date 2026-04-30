import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { parseAmplifyConfig } from "aws-amplify/utils";

const amplifyOutputsPath = path.join(process.cwd(), "amplify_outputs.json");

function readAmplifyOutputs() {
  if (!existsSync(amplifyOutputsPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(amplifyOutputsPath, "utf8")) as Record<string, unknown>;
  } catch (error) {
    console.error("Unable to read amplify_outputs.json", error);

    return {};
  }
}

export const amplifyOutputs = readAmplifyOutputs();
export const amplifyConfig = parseAmplifyConfig(amplifyOutputs);
export type AmplifyOutputs = typeof amplifyOutputs;

export const isAmplifyAuthConfigured = Boolean(
  amplifyConfig.Auth?.Cognito?.userPoolId &&
    amplifyConfig.Auth?.Cognito?.userPoolClientId
);

export const cognitoRegion =
  amplifyConfig.Auth?.Cognito?.userPoolId?.split("_")[0] ?? null;

export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyOutputs,
});
