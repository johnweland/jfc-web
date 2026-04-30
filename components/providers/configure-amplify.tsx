"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Configure at module load time so Amplify is ready before any component
// renders or calls storage/auth APIs. The render-time approach caused a race
// where uploadData (and other client API calls) ran before Amplify.configure.
Amplify.configure(outputs, { ssr: true });

export function ConfigureAmplify() {
  return null;
}
