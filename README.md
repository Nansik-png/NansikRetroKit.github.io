# NansikRetroKit.github.io

© 2026 Nansik Retro Kit. All rights reserved.

Website coded by GitHub: ajversaily.

## Stripe setup

This site is static, so do not put a Stripe secret key in the repo. Use only your Stripe publishable key and product Price IDs in `js/stripe-config.js`.

1. In Stripe Dashboard, create one Product/Price for each jersey.
2. Copy each `price_...` ID into `js/stripe-config.js`.
3. Copy your live publishable key, `pk_live_...`, into `publishableKey`.
4. Deploy to GitHub Pages and test checkout from `cart.html`.

The checkout button stays disabled until the cart has items. If Stripe values are still placeholders, the site will show a setup message instead of redirecting.
