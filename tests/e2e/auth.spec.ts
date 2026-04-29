import { expect, test } from "@playwright/test";

test("account routes redirect unauthenticated visitors to the shared auth page", async ({
  page,
}) => {
  await page.goto("/account");

  await expect(page).toHaveURL(/\/sign-in\?redirect=%2Faccount$/);
  await expect(
    page.getByRole("heading", { name: /secure access for customers, staff, and admins\./i }),
  ).toBeVisible();
});

test("shared auth page supports sign in and create account from one endpoint", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await expect(
    page.getByRole("tab", { name: "Sign In" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Create Account" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Create Account" }).click();

  await expect(page.getByLabel("First name")).toBeVisible();
  await expect(page.getByLabel("Last name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /create account/i }),
  ).toBeVisible();
});

test("account security route redirects unauthenticated visitors to shared auth", async ({
  page,
}) => {
  await page.goto("/account/security");

  await expect(page).toHaveURL(/\/sign-in\?redirect=%2Faccount$/);
  await expect(
    page.getByRole("tab", { name: "Sign In" }),
  ).toBeVisible();
});
