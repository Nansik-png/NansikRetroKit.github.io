/ ============= PRODUCT PAGE =============
function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id") || productSlug(params.get("name"));
  const product = getProduct(productId);
  const name = product 
    ? product.name 
    : (params.get("name") ? decodeURIComponent(params.get("name")) : "Unnamed Product");
  const desc = product 
    ? productDesc(product) 
    : (params.get("desc") ? decodeURIComponent(params.get("desc")) : "No description available.");

  function fixedImagePath(image) {
    return assetImagePath(image);
  }

  const imagesParam = params.get("images");
  let images = imagesParam
    ? imagesParam.split(",").map(img => fixedImagePath(decodeURIComponent(img)))
    : [params.get("image") ? fixedImagePath(decodeURIComponent(params.get("image"))) : ""];

  let currentIndex = 0;

  const mainImage = document.getElementById("mainImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (mainImage) {
    mainImage.src = images[0];
    mainImage.classList.add("zoomable");
    mainImage.onerror = function () {
      this.onerror = null;
      this.src = "images/redkappa.jpeg";
    };
    mainImage.addEventListener("click", (event) => {
      if (!mainImage) return;
      const rect = mainImage.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const originX = (offsetX / rect.width) * 100;
      const originY = (offsetY / rect.height) * 100;

      const isZoomed = mainImage.classList.toggle("zoomed");
      if (isZoomed) {
        mainImage.style.transformOrigin = `${originX}% ${originY}%`;
        mainImage.style.transform = "scale(1.9)";
      } else {
        mainImage.style.transformOrigin = "center center";
        mainImage.style.transform = "scale(1)";
      }
    });
  }

  if (document.getElementById("productName")) {
    document.getElementById("productName").innerText = name;
  }
  if (document.getElementById("productDesc")) {
    document.getElementById("productDesc").innerText = desc;
  }

  if (images.length > 1 && prevBtn && nextBtn) {
    prevBtn.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    if (mainImage) mainImage.src = images[currentIndex];
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    if (mainImage) mainImage.src = images[currentIndex];
  }

  if (nextBtn) nextBtn.onclick = nextImage;
  if (prevBtn) prevBtn.onclick = prevImage;

  const addToCartBtn = document.getElementById("addToCart");
  const goToCartBtn = document.getElementById("goToCart");
  const cartStatus = document.getElementById("cartStatus");

  if (addToCartBtn) {
    addToCartBtn.onclick = function () {
      const added = addToCart(productId);
      if (!added) return;

      addToCartBtn.textContent = "Added";
      addToCartBtn.classList.add("bg-black", "text-white");
      if (cartStatus) cartStatus.textContent = `${added.name} is in your cart.`;
      if (goToCartBtn) goToCartBtn.classList.remove("hidden");

      window.setTimeout(() => {
        addToCartBtn.textContent = "Add to Cart";
        addToCartBtn.classList.remove("bg-black", "text-white");
      }, 1000);
    };
  }

  if (goToCartBtn) {
    goToCartBtn.onclick = function () {
      window.location.href = "cart.html";
    };
  }
}

// ============= CART PAGE =============
function initCartPage() {
  let cart = getCart();
  const container = document.getElementById("cartContainer");
  const totalPriceEl = document.getElementById("totalPrice");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const checkoutStatus = document.getElementById("checkoutStatus");

  if (!container || !totalPriceEl || !checkoutBtn) return;

  function renderCart() {
    cart = getCart();
    container.innerHTML = "";

    if (cart.length === 0) {
      container.innerHTML = "<p class='text-gray-600'>Your cart is empty. <a href='shop.html' class='text-blue-500 hover:underline'>Continue shopping</a></p>";
      totalPriceEl.innerText = "$0.00";
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add("opacity-40", "cursor-not-allowed");
      return;
    }

    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove("opacity-40", "cursor-not-allowed");

    cart.forEach((item) => {
      const div = document.createElement("div");
      div.className = "flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-md hover:shadow-md transition";

      div.innerHTML = `
        <img src="${item.image}" class="w-24 h-24 object-cover rounded" alt="${item.name}" onerror="this.onerror=null;this.src='images/redkappa.jpeg'">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-lg">${item.name}</p>
          <p class="text-gray-600 text-sm">${formatMoney(item.price)} each</p>
          <p class="text-sm font-semibold mt-1">${formatMoney(item.price * item.quantity)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-action="decrease" class="w-9 h-9 border hover:bg-black hover:text-white transition" aria-label="Decrease ${item.name} quantity">-</button>
          <span class="w-10 text-center font-semibold">${item.quantity}</span>
          <button data-action="increase" class="w-9 h-9 border hover:bg-black hover:text-white transition" aria-label="Increase ${item.name} quantity">+</button>
        </div>
        <button data-action="remove" class="border border-red-500 text-red-500 px-3 py-2 text-sm hover:bg-red-500 hover:text-white transition rounded">
          Remove
        </button>
      `;

      div.querySelector('[data-action="decrease"]').onclick = () => {
        if (item.quantity === 1) {
          removeFromCart(item.id);
        } else {
          setCartQuantity(item.id, item.quantity - 1);
        }
        renderCart();
      };

      div.querySelector('[data-action="increase"]').onclick = () => {
        setCartQuantity(item.id, item.quantity + 1);
        renderCart();
      };

      div.querySelector('[data-action="remove"]').onclick = () => {
        removeFromCart(item.id);
        renderCart();
      };

      container.appendChild(div);
    });

    totalPriceEl.innerText = formatMoney(cartTotal(cart));
  }

  renderCart();

  const checkoutResult = new URLSearchParams(window.location.search).get("checkout");
  if (checkoutResult === "success") {
    if (checkoutStatus) checkoutStatus.textContent = "Payment completed. Thank you for your order.";
    clearCart();
    renderCart();
  } else if (checkoutResult === "cancelled") {
    if (checkoutStatus) checkoutStatus.textContent = "Checkout cancelled. Your cart is still saved.";
  }

  if (checkoutBtn) {
    checkoutBtn.onclick = async () => {
      if (cart.length === 0) {
        if (checkoutStatus) checkoutStatus.textContent = "Your cart is empty.";
        return;
      }
      initiateStripeCheckout();
    };
  }
}

// ============= SHOP PAGE QUICK ADD =============
function quickAdd(productId, btn) {
  const product = addToCart(productId);
  if (!product) return;

  const originalText = btn.textContent;
  btn.textContent = "✓"; // checkmark fits the round quick-add button
  btn.classList.add("is-added");

  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("is-added");
  }, 1000);
}

// ============= PRODUCT NAVIGATION =============
function goToProduct(name, image, desc) {
  const id = productSlug(name);
  window.location.href = getProduct(id) ? productUrl(id) : 'product.html?' +
    'name=' + encodeURIComponent(name) +
    '&image=' + encodeURIComponent(image) +
    '&desc=' + encodeURIComponent(desc);
}

// ============= STRIPE CHECKOUT =============
function initiateStripeCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const checkoutStatus = document.getElementById("checkoutStatus");
  const cart = getCart();

  if (cart.length === 0) {
    if (checkoutStatus) checkoutStatus.textContent = "Your cart is empty.";
    return;
  }

  const config = window.NANSIK_STRIPE || {};
  const missingConfig = !config.publishableKey || config.publishableKey.includes("REPLACE");
  const lineItems = cart.map((item) => ({
    price: config.prices ? config.prices[item.id] : "",
    quantity: item.quantity
  }));
  const missingPrices = lineItems.some((item) => !item.price || item.price.includes("REPLACE"));

  if (missingConfig || missingPrices) {
    if (checkoutStatus) checkoutStatus.textContent = "Add your Stripe publishable key and Price IDs in js/stripe-config.js before checkout can go live.";
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = true;
  if (checkoutBtn) checkoutBtn.textContent = "Opening Stripe...";
  if (checkoutStatus) checkoutStatus.textContent = `Redirecting securely for ${formatMoney(cartTotal(cart))}.`;

  const stripe = Stripe(config.publishableKey);
  stripe.redirectToCheckout({
    lineItems,
    mode: "payment",
    successUrl: config.successUrl,
    cancelUrl: config.cancelUrl
  }).then((result) => {
    if (result.error) {
      if (checkoutStatus) checkoutStatus.textContent = result.error.message;
      if (checkoutBtn) checkoutBtn.disabled = false;
      if (checkoutBtn) checkoutBtn.textContent = "Proceed to Checkout";
    }
  });
}

// ============= EVENT BINDING =============
function bindPageActions() {
  document.querySelectorAll("[data-action=quick-add]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const target = event.currentTarget;
      const productId = target.getAttribute("data-product-id");
      if (!productId) return;
      quickAdd(productId, target);
    });
  });

  document.querySelectorAll("[data-action=view-product]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const target = event.currentTarget;
      const name = target.getAttribute("data-product-name");
      const image = target.getAttribute("data-product-image");
      const desc = target.getAttribute("data-product-desc");
      if (!name || !image || !desc) return;
      goToProduct(name, image, desc);
    });
  });

  document.querySelectorAll("[data-action=navigate]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const target = event.currentTarget;
      const href = target.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  });
}

// ============= INITIALIZATION =============
document.addEventListener("DOMContentLoaded", () => {
  bindPageActions();
  if (document.getElementById("productName")) {
    initProductPage();
  }
  if (document.getElementById("cartContainer")) {
    initCartPage();
  }
});
