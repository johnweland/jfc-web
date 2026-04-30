"use client";

import { Amplify } from "aws-amplify";
import { useRef } from "react";

export function ConfigureAmplify({
  outputs,
}: {
  outputs: Record<string, unknown>;
}) {
  const didConfigure = useRef(false);

  // Configure exactly once on the client before child effects run.
  if (!didConfigure.current) {
    Amplify.configure(outputs, { ssr: true });
    didConfigure.current = true;
  }

  return null;
}
