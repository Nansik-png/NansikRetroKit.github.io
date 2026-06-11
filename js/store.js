const PRODUCTS = {
  "kaka-ac-milan-06-07": {
    id: "kaka-ac-milan-06-07",
    name: "KAKA AC Milan 06-07",
    image: "images/redkappa.jpeg",
    price: 42.99,
    description: "Premium Retro Jersey"
  },
  "juventus-pink": {
    id: "juventus-pink",
    name: "Juventus Pink",
    image: "images/juventuspink.PNG",
    price: 29.99,
    description: "Premium Retro Jersey"
  },
  "brazil-jersey": {
    id: "brazil-jersey",
    name: "Brazil Jersey",
    image: "images/brazil.PNG",
    price: 34.99,
    description: "Iconic Retro Jersey"
  },
  "japan-jersey": {
    id: "japan-jersey",
    name: "Japan Jersey",
    image: "images/japan.PNG",
    price: 32.99,
    description: "Premium Retro Jersey"
  },
  "maradona-jersey": {
    id: "maradona-jersey",
    name: "Maradona Jersey",
    image: "images/maradona.PNG",
    price: 39.99,
    description: "Legend Retro Jersey"
  },
  "santos-jersey": {
    id: "santos-jersey",
    name: "Santos Jersey",
    image: "images/santos.PNG",
    price: 35.99,
    description: "Classic Retro Jersey"
  }
};

const imageFixes = {
  "IMG_3076.jpeg": "images/redkappa.jpeg",
  "redkappa.jpeg": "images/redkappa.jpeg",
  "IMG_3079.jpeg": "images/juventuspink.PNG",
  "juventuspink.PNG": "images/juventuspink.PNG",
  "brazil.PNG": "images/brazil.PNG",
  "japan.PNG": "images/japan.PNG",
  "maradona.PNG": "images/maradona.PNG",
  "santos.PNG": "images/santos.PNG",
  "Photoroom_20250318_152243.JPG": "images/sportinglisbon0203.JPG",
  "sportinglisbon0203.JPG": "images/sportinglisbon0203.JPG",
  "Photoroom_20250318_152823.JPG": "images/juventus9798.JPG",
  "juventus9798.JPG": "images/juventus9798.JPG"
};

function assetImagePath(image) {
  if (!image) return "";
  return imageFixes[image] || image;
}

function productSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function productDesc(product) {
  return `${product.name} | Price: ${formatMoney(product.price)} | ${product.description}`;
}

function getProduct(id) {
  return PRODUCTS[id] || null;
}

function productUrl(id) {
  const product = getProduct(id);
  if (!product) return "shop.html";

  return "product.html?" + new URLSearchParams({
    id: product.id,
    name: product.name,
    image: product.image,
    desc: productDesc(product)
  }).toString();
}

function getCart() {
  const saved = JSON.parse(localStorage.getItem("cart") || "[]");

  const normalized = saved.map((item) => {
    const id = item.id || productSlug(item.name);
    const knownProduct = getProduct(id);
    const priceMatch = String(item.desc || "").match(/Price:\s*\$(\d+(\.\d+)?)/);
    const price = knownProduct ? knownProduct.price : Number(priceMatch ? priceMatch[1] : item.price || 0);

    return {
      id,
      name: knownProduct ? knownProduct.name : item.name,
      image: assetImagePath(knownProduct ? knownProduct.image : item.image),
      desc: knownProduct ? productDesc(knownProduct) : item.desc,
      price,
      quantity: Math.max(1, Number(item.quantity || 1))
    };
  });

  return normalized.reduce((items, item) => {
    const existing = items.find((savedItem) => savedItem.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }
    return items;
  }, []);
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadges();
}

function cartItemCount(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartBadges() {
  document.querySelectorAll("[data-cart-count], #cartCount").forEach((badge) => {
    badge.textContent = cartItemCount();
    badge.classList.add("cart-count-pop");
    window.setTimeout(() => badge.classList.remove("cart-count-pop"), 250);
  });
}

function addToCart(id, quantity = 1) {
  const product = getProduct(id);
  if (!product) return null;

  const cart = getCart();
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      desc: productDesc(product),
      price: product.price,
      quantity
    });
  }

  saveCart(cart);
  return product;
}

function setCartQuantity(id, quantity) {
  const cart = getCart()
    .map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
    .filter((item) => item.quantity > 0);
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

function clearCart() {
  saveCart([]);
}

document.addEventListener("DOMContentLoaded", updateCartBadges);
