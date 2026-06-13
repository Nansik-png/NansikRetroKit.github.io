# NansikRetroKit.github.io

© 2026 Nansik Retro Kit. All rights reserved.

Website coded by GitHub: ajversaily.

## Payments (Stripe Checkout + Apple Pay)

Card numbers are never handled by this site. The "Proceed to Checkout" button sends the
cart to a small server function (`api/create-checkout-session.js`), which asks Stripe for a
secure hosted checkout page. That hosted page handles the card form and Apple Pay.

The secret key never goes in the repo — it lives only in a Vercel environment variable.

Setup:

1. Create a Stripe account and copy your secret key (`sk_test_...` first, `sk_live_...` later).
2. Import this repo into Vercel. Vercel auto-detects the `api/` folder.
3. In Vercel → Project → Settings → Environment Variables, add `STRIPE_SECRET_KEY`.
4. In Stripe → Settings → Payment methods, enable Apple Pay.
5. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.

Prices live in two places and must be kept in sync: `js/store.js` (display only) and
`api/create-checkout-session.js` (the amount actually charged). The server price is the
one that takes the money.
