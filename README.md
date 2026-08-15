This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Worldnet HPP Checkout

Worldnet checkout is implemented as a hosted payment page redirect so card entry stays on Worldnet infrastructure and card data never touches this app.

Required env vars:

- `NEXT_PUBLIC_SITE_URL`
- `WORLDNET_ENV`
- `WORLDNET_PAYMENT_URL`
- `WORLDNET_TERMINAL_ID`
- `WORLDNET_TERMINAL_SECRET`
- `WORLDNET_CURRENCY`
- `WORLDNET_RECEIPT_PATH`
- `WORLDNET_VALIDATION_PATH`
- `WORLDNET_HASH_MODE`
- `WORLDNET_HASH_ALGORITHM`
- `WORLDNET_BACKGROUND_VALIDATION_ENABLED`

Recommended local sandbox values:

```bash
NEXT_PUBLIC_SITE_URL=https://local.weland.family
WORLDNET_ENV=sandbox
WORLDNET_PAYMENT_URL=https://testpayments.worldnettps.com/merchant/paymentpage
WORLDNET_TERMINAL_ID=4480001
WORLDNET_TERMINAL_SECRET=mySharedSecretUSD
WORLDNET_CURRENCY=USD
WORLDNET_RECEIPT_PATH=/checkout/worldnet/receipt
WORLDNET_VALIDATION_PATH=/api/worldnet/validation
WORLDNET_HASH_MODE=single_currency
WORLDNET_HASH_ALGORITHM=sha512
WORLDNET_BACKGROUND_VALIDATION_ENABLED=0
```

Local testing notes:

- Run the app behind the externally reachable `https://local.weland.family` URL so Worldnet can call both the receipt and validation endpoints.
- Sandbox declines can be simulated by using an amount ending in `.01`; any other cent value should authorize per Worldnet's testing guide.
- The validation route answers with plain `OK` only after the incoming Worldnet hash validates.
- The receipt page does not trust the browser redirect on its own; it waits for the verified background validation before moving an order into the paid fulfillment flow.
- The shared Worldnet USD sandbox terminal does not have Background Validation enabled, so local sandbox testing should use `WORLDNET_BACKGROUND_VALIDATION_ENABLED=0`. Set it to `1` only for terminals where Worldnet has enabled the feature.

Switching sandbox to production:

- Replace `WORLDNET_PAYMENT_URL`, `WORLDNET_TERMINAL_ID`, `WORLDNET_TERMINAL_SECRET`, and any terminal-specific paths or site URL values with the live credentials supplied by Worldnet.
- Keep `WORLDNET_HASH_MODE` aligned with the terminal configuration. The shared USD sandbox terminal is a single-currency terminal, so local testing should use `single_currency`. Use `multi_currency` only for terminals Worldnet has configured for multi-currency hashing.
- Keep `WORLDNET_HASH_ALGORITHM=sha512` when the terminal has SHA-512 hashing enabled. Some older sandbox terminals may still expect legacy MD5 hashing; use `WORLDNET_HASH_ALGORITHM=md5_legacy` only for that compatibility case.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
