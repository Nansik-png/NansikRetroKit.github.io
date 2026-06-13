// Main functionality for cart and product pages

// ============= PRODUCT PAGE =============
function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  let productId = params.get("id") || productSlug(params.get("name"));
  let product = getProduct(productId);

  if (!product && params.get("name")) {
    const requestedName = decodeURIComponent(params.get("name"));
    product = Object.values(PRODUCTS).find((item) => item.name === requestedName) || null;
    if (product) {
      productId = product.id;
    }
  }

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
    const sizeChooser = document.getElementById("sizeChooser");

    // Show size chooser when Add to Cart is clicked
    addToCartBtn.onclick = function () {
      if (sizeChooser) {
        sizeChooser.classList.remove("hidden");
        sizeChooser.setAttribute("aria-hidden", "false");
        const first = sizeChooser.querySelector(".size-option");
        if (first) first.focus();
      }
    };

    // When a size button is clicked, add item with that size
    document.querySelectorAll(".size-option").forEach((btn) => {
      btn.onclick = function () {
        const selectedSize = this.getAttribute("data-size") || "M";
        const added = addToCart(productId, 1, selectedSize);
        if (!added) return;

        addToCartBtn.textContent = "Added";
        addToCartBtn.classList.add("bg-black", "text-white");
        if (cartStatus) cartStatus.textContent = `${added.name} (${selectedSize}) is in your cart.`;
        if (goToCartBtn) goToCartBtn.classList.remove("hidden");

        if (sizeChooser) {
          sizeChooser.classList.add("hidden");
          sizeChooser.setAttribute("aria-hidden", "true");
        }

        window.setTimeout(() => {
          addToCartBtn.textContent = "Add to Cart";
          addToCartBtn.classList.remove("bg-black", "text-white");
        }, 1000);
      };
    });
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
          ${item.size ? `<p class="text-gray-600 text-sm">Size: ${item.size}</p>` : ""}
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
      cart = getCart();
      if (cart.length === 0) {
        if (checkoutStatus) checkoutStatus.textContent = "Your cart is empty.";
        return;
      }

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Opening secure checkout...";
      if (checkoutStatus) checkoutStatus.textContent = `Redirecting securely for ${formatMoney(cartTotal(cart))}.`;

      try {
        // Send only what we bought; the server decides the price.
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: window.location.origin,
            items: cart.map((item) => ({
              id: item.baseId,
              size: item.size,
              quantity: item.quantity
            }))
          })
        });

        const data = await response.json();
        if (!response.ok || !data.url) {
          throw new Error(data.error || "Checkout failed. Please try again.");
        }

        // Stripe-hosted page: handles the card form and Apple Pay safely.
        window.location.href = data.url;
      } catch (err) {
        if (checkoutStatus) checkoutStatus.textContent = err.message || "Could not start checkout.";
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Proceed to Checkout";
      }
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
  const fallbackId = productSlug(name);
  const product = getProduct(fallbackId) || Object.values(PRODUCTS).find((item) => item.name === name);
  const id = product ? product.id : fallbackId;
  window.location.href = product ? productUrl(id) : 'product.html?' +
    'name=' + encodeURIComponent(name) +
    '&image=' + encodeURIComponent(image) +
    '&desc=' + encodeURIComponent(desc);
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
