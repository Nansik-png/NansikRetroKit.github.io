// Creates a Stripe Checkout session. Runs on Vercel's server, never in the browser.
const Stripe = require("stripe");

// The REAL prices live here, on the server, in cents. The browser can never change them.
// Keep these in sync with js/store.js PRODUCTS.
const CATALOG = {
  "kaka-ac-milan-06-07":   { name: "KAKA AC Milan 06-07",       amount: 4299 },
  "juventus-pink":         { name: "Juventus 97-98",            amount: 2999 },
  "brazil-jersey":         { name: "Brazil 98-99 X R9",         amount: 3499 },
  "japan-jersey":          { name: "Japan Concept Jersey",      amount: 3299 },
  "maradona-jersey":       { name: "Maradona x Argentina",      amount: 3999 },
  "santos-jersey":         { name: "Santos x Neymar JR 12-13",  amount: 3599 },
  "juventus-9798":         { name: "Juventus 97-98",            amount: 2999 }
};

const CURRENCY = "usd";

module.exports = async (req, res) => {
  // Only accept POST. Anything else is rejected.
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  // The secret key is read from a Vercel environment variable, not from any file.
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "Server is missing STRIPE_SECRET_KEY." });
    return;
  }

  const stripe = Stripe(secretKey);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];

    // Build the order line by line using OUR prices, ignoring whatever the browser sent.
    const lineItems = [];
    for (const item of items) {
      const product = CATALOG[item.id];
      if (!product) continue; // skip anything we don't actually sell

      const quantity = Math.min(20, Math.max(1, parseInt(item.quantity, 10) || 1));
      const size = String(item.size || "M").slice(0, 3);

      lineItems.push({
        quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: product.amount,
          product_data: { name: `${product.name} (Size ${size})` }
        }
      });
    }

    if (lineItems.length === 0) {
      res.status(400).json({ error: "Cart is empty or has no valid items." });
      return;
    }

    // Where Stripe sends the buyer back to. Falls back to the request's own origin.
    const origin = body.origin || req.headers.origin || "";

    // No payment_method_types set on purpose: Stripe then offers everything enabled
    // in your dashboard, which includes Apple Pay and Google Pay automatically.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/cart.html?checkout=success`,
      cancel_url: `${origin}/cart.html?checkout=cancelled`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
};
