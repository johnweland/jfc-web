import { describe, expect, it } from "vitest";

import { helloWorld } from "@/lib/hello";

describe("helloWorld", () => {
  it("returns hello world", () => {
    expect(helloWorld()).toBe("hello world");
  });
});
