window.NANSIK_STRIPE = {
// replace ts also keep secret files out of this github lol
  publishableKey: "pk_live_REPLACE_WITH_YOUR_PUBLISHABLE_KEY",
  successUrl: `${window.location.origin}${window.location.pathname.replace(/cart\.html$/, "")}cart.html?checkout=success`,
  cancelUrl: `${window.location.origin}${window.location.pathname.replace(/cart\.html$/, "")}cart.html?checkout=cancelled`,
  prices: {
    "kaka-ac-milan-06-07": "price_REPLACE_KAKA",
    "juventus-pink": "price_REPLACE_JUVENTUS_PINK",
    "brazil-jersey": "price_REPLACE_BRAZIL",
    "japan-jersey": "price_REPLACE_JAPAN",
    "maradona-jersey": "price_REPLACE_MARADONA",
    "santos-jersey": "price_REPLACE_SANTOS"
  }
};
