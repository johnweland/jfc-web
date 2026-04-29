"use client";

import { Amplify } from "aws-amplify";

let hasConfiguredAmplify = false;

export function ConfigureAmplify({
  outputs,
}: {
  outputs: Record<string, unknown>;
}) {
  if (!hasConfiguredAmplify && Object.keys(outputs).length > 0) {
    Amplify.configure(outputs, { ssr: true });
    hasConfiguredAmplify = true;
  }

  return null;
}
