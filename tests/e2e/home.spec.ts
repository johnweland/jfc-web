import { expect, test } from "@playwright/test";

test("homepage renders the public website shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: /jackson firearm co\./i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /equipping the modern operator/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "SHOP FIREARMS" })).toBeVisible();
  await expect(
    page.getByText(/compliance notice:/i),
  ).toBeVisible();
});

test("ffl info stays under the website layout", async ({ page }) => {
  await page.goto("/ffl-info");

  await expect(
    page.getByRole("heading", { name: /ffl transfers both directions\./i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /jackson firearm co\./i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /ffl information/i }),
  ).toBeVisible();
});
