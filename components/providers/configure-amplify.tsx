"use client";

import { Amplify } from "aws-amplify";

let hasConfiguredAmplify = false;

export function ConfigureAmplify({
  outputs,
}: {
  outputs: Record<string, unknown>;
}) {
  // Configure exactly once on the client before child effects run.
  if (!hasConfiguredAmplify) {
    Amplify.configure(outputs, { ssr: true });
    hasConfiguredAmplify = true;
  }

  return null;
}
