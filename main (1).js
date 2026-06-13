// ============= PRODUCT PAGE =============
function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  let productId = params.get("id") || productSlug(params.get("name"));
  let product = getProduct(productId);

  if (!product && params.get("name")) {
    const requestedName = decodeURIComponent(params.get("name"));
    product = Object.values(PRODUCTS).find((p) => p.name === requestedName) || null;
    if (product) productId = product.id;
  }

  const name = product
    ? product.name
    : (params.get("name") ? decodeURIComponent(params.get("name")) : "Unnamed Product");
  const desc = product
    ? productDesc(product)
    : (params.get("desc") ? decodeURIComponent(params.get("desc")) : "No description available.");

  // Build image list: prefer product.images, fall back to URL params
  let images;
  if (product && product.images && product.images.length) {
    images = product.images;
  } else {
    const imagesParam = params.get("images");
    images = imagesParam
      ? imagesParam.split(",").map((img) => assetImagePath(decodeURIComponent(img)))
      : [params.get("image") ? assetImagePath(decodeURIComponent(params.get("image"))) : ""];
  }

  images = images.filter(Boolean);
  if (!images.length) images = ["images/redkappa.jpeg"];

  let currentIndex = 0;

  const mainImage = document.getElementById("mainImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const dotsEl = document.getElementById("carouselDots");
  const thumbStrip = document.getElementById("thumbnailStrip");

  // Set product text
  if (document.getElementById("productName")) {
    document.getElementById("productName").innerText = name;
  }
  if (document.getElementById("productDesc")) {
    document.getElementById("productDesc").innerText = desc;
  }

  // ---- Carousel setup ----
  if (mainImage) {
    mainImage.src = images[0];
    mainImage.classList.add("zoomable");
    mainImage.onerror = function () {
      this.onerror = null;
      this.src = "images/redkappa.jpeg";
    };

    // Zoom on click
    mainImage.addEventListener("click", () => {
      const isZoomed = mainImage.classList.toggle("zoomed");
      if (!isZoomed) {
        mainImage.style.transform = "scale(1)";
        mainImage.style.transformOrigin = "center center";
      }
    });
    mainImage.addEventListener("mousemove", (e) => {
      if (!mainImage.classList.contains("zoomed")) return;
      const rect = mainImage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImage.style.transformOrigin = `${x}% ${y}%`;
      mainImage.style.transform = "scale(1.9)";
    });
  }

  function goToSlide(index) {
    if (!mainImage) return;
    currentIndex = (index + images.length) % images.length;

    mainImage.classList.add("carousel-fade");
    setTimeout(() => {
      mainImage.src = images[currentIndex];
      mainImage.classList.remove("carousel-fade");
    }, 150);

    // un-zoom when navigating
    mainImage.classList.remove("zoomed");
    mainImage.style.transform = "scale(1)";
    mainImage.style.transformOrigin = "center center";

    // sync dots
    if (dotsEl) {
      dotsEl.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("carousel-dot--active", i === currentIndex);
      });
    }

    // sync thumbnails
    if (thumbStrip) {
      thumbStrip.querySelectorAll(".thumb").forEach((thumb, i) => {
        thumb.classList.toggle("thumb--active", i === currentIndex);
      });
    }
  }

  if (images.length > 1) {
    // Show nav buttons
    if (prevBtn) { prevBtn.classList.remove("hidden"); prevBtn.onclick = () => goToSlide(currentIndex - 1); }
    if (nextBtn) { nextBtn.classList.remove("hidden"); nextBtn.onclick = () => goToSlide(currentIndex + 1); }

    // Build dots
    if (dotsEl) {
      dotsEl.classList.remove("hidden");
      images.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "carousel-dot" + (i === 0 ? " carousel-dot--active" : "");
        dot.setAttribute("aria-label", `Go to image ${i + 1}`);
        dot.onclick = () => goToSlide(i);
        dotsEl.appendChild(dot);
      });
    }

    // Build thumbnail strip
    if (thumbStrip) {
      thumbStrip.classList.remove("hidden");
      images.forEach((src, i) => {
        const thumb = document.createElement("button");
        thumb.className = "thumb" + (i === 0 ? " thumb--active" : "");
        thumb.setAttribute("aria-label", `View image ${i + 1}`);
        thumb.onclick = () => goToSlide(i);
        const img = document.createElement("img");
        img.src = src;
        img.alt = `${name} — photo ${i + 1}`;
        img.onerror = function () { this.onerror = null; this.src = "images/redkappa.jpeg"; };
        thumb.appendChild(img);
        thumbStrip.appendChild(thumb);
      });
    }
  }

  // ---- Add to cart / size chooser ----
  const addToCartBtn = document.getElementById("addToCart");
  const goToCartBtn = document.getElementById("goToCart");
  const cartStatus = document.getElementById("cartStatus");
  const sizeChooser = document.getElementById("sizeChooser");

  if (addToCartBtn) {
    addToCartBtn.onclick = function () {
      if (sizeChooser) {
        sizeChooser.classList.remove("hidden");
        sizeChooser.setAttribute("aria-hidden", "false");
        const first = sizeChooser.querySelector(".size-option");
        if (first) first.focus();
      }
    };

    document.querySelectorAll(".size-option").forEach((btn) => {
      btn.onclick = function () {
        const selectedSize = this.getAttribute("data-size") || "M";
        const added = addToCart(productId, 1, selectedSize);
        if (!added) return;

        addToCartBtn.textContent = "Added";
        addToCartBtn.classList.add("bg-black", "text-white");
        if (cartStatus) cartStatus.textContent = `${added.name} (${selectedSize}) added to cart.`;
        if (goToCartBtn) goToCartBtn.classList.remove("hidden");

        if (sizeChooser) {
          sizeChooser.classList.add("hidden");
          sizeChooser.setAttribute("aria-hidden", "true");
        }

        window.setTimeout(() => {
          addToCartBtn.textContent = "Add to Cart";
          addToCartBtn.classList.remove("bg-black", "text-white");
        }, 1200);
      };
    });
  }

  if (goToCartBtn) {
    goToCartBtn.onclick = () => { window.location.href = "cart.html"; };
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

      window.location.href = data.url;
    } catch (err) {
      if (checkoutStatus) checkoutStatus.textContent = err.message || "Could not start checkout.";
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Proceed to Checkout";
    }
  };
}

// ============= SHOP PAGE QUICK ADD =============
function quickAdd(productId, btn) {
  const product = addToCart(productId);
  if (!product) return;

  const originalText = btn.textContent;
  btn.textContent = "✓";
  btn.classList.add("is-added");

  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("is-added");
  }, 1000);
}

// ============= PRODUCT NAVIGATION =============
function goToProduct(name, image, desc) {
  const fallbackId = productSlug(name);
  const product = getProduct(fallbackId) || Object.values(PRODUCTS).find((p) => p.name === name);
  const id = product ? product.id : fallbackId;
  window.location.href = product
    ? productUrl(id)
    : "product.html?" +
      "name=" + encodeURIComponent(name) +
      "&image=" + encodeURIComponent(image) +
      "&desc=" + encodeURIComponent(desc);
}

// ============= QUICK-VIEW MODAL =============
function initQuickView() {
  const modal = document.getElementById("quickViewModal");
  if (!modal) return;

  const qvImage = document.getElementById("qvImage");
  const qvPrev = document.getElementById("qvPrev");
  const qvNext = document.getElementById("qvNext");
  const qvDots = document.getElementById("qvDots");
  const qvName = document.getElementById("qvName");
  const qvPrice = document.getElementById("qvPrice");
  const qvSizeChooser = document.getElementById("qvSizeChooser");
  const qvAddToCart = document.getElementById("qvAddToCart");
  const qvViewProduct = document.getElementById("qvViewProduct");
  const qvStatus = document.getElementById("qvStatus");
  const qvClose = document.getElementById("qvClose");

  let currentProductId = null;
  let images = [];
  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = (index + images.length) % images.length;
    qvImage.classList.add("carousel-fade");
    setTimeout(() => {
      qvImage.src = images[currentIndex];
      qvImage.classList.remove("carousel-fade");
    }, 150);
    qvDots.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("carousel-dot--active", i === currentIndex);
    });
  }

  function openModal(productId) {
    const product = getProduct(productId);
    if (!product) return;

    currentProductId = productId;
    images = (product.images && product.images.length) ? product.images : [product.image];
    currentIndex = 0;

    qvName.textContent = product.name;
    qvPrice.textContent = formatMoney(product.price);
    qvImage.src = images[0];
    qvImage.alt = product.name;
    qvImage.onerror = function () { this.onerror = null; this.src = "images/redkappa.jpeg"; };

    // Reset state
    qvStatus.textContent = "";
    qvAddToCart.textContent = "Add to Cart";
    qvAddToCart.classList.remove("bg-black", "text-white");
    qvSizeChooser.classList.add("hidden");
    qvSizeChooser.setAttribute("aria-hidden", "true");

    // Dots
    qvDots.innerHTML = "";
    if (images.length > 1) {
      qvPrev.classList.remove("hidden");
      qvNext.classList.remove("hidden");
      qvDots.classList.remove("hidden");
      images.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "carousel-dot" + (i === 0 ? " carousel-dot--active" : "");
        dot.setAttribute("aria-label", `Go to image ${i + 1}`);
        dot.onclick = () => goToSlide(i);
        qvDots.appendChild(dot);
      });
    } else {
      qvPrev.classList.add("hidden");
      qvNext.classList.add("hidden");
      qvDots.classList.add("hidden");
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    qvClose.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    currentProductId = null;
  }

  qvPrev.onclick = () => goToSlide(currentIndex - 1);
  qvNext.onclick = () => goToSlide(currentIndex + 1);
  qvClose.onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  qvAddToCart.onclick = function () {
    if (!qvSizeChooser.classList.contains("hidden")) return;
    qvSizeChooser.classList.remove("hidden");
    qvSizeChooser.setAttribute("aria-hidden", "false");
    qvSizeChooser.querySelector(".qv-size-option").focus();
  };

  document.querySelectorAll(".qv-size-option").forEach((btn) => {
    btn.onclick = function () {
      if (!currentProductId) return;
      const size = this.getAttribute("data-size") || "M";
      const added = addToCart(currentProductId, 1, size);
      if (!added) return;

      qvAddToCart.textContent = "Added!";
      qvAddToCart.classList.add("bg-black", "text-white");
      qvStatus.textContent = `${added.name} (${size}) added to cart.`;
      qvSizeChooser.classList.add("hidden");
      qvSizeChooser.setAttribute("aria-hidden", "true");

      setTimeout(() => {
        qvAddToCart.textContent = "Add to Cart";
        qvAddToCart.classList.remove("bg-black", "text-white");
      }, 1500);
    };
  });

  qvViewProduct.onclick = () => {
    if (currentProductId) window.location.href = productUrl(currentProductId);
  };

  // Expose openModal for event binding
  window._openQuickView = openModal;
}

// ============= EVENT BINDING =============
function bindPageActions() {
  document.querySelectorAll("[data-action=quick-add]").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.currentTarget.getAttribute("data-product-id");
      if (productId) quickAdd(productId, e.currentTarget);
    });
  });

  document.querySelectorAll("[data-action=quick-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const productId = e.currentTarget.getAttribute("data-product-id");
      if (productId && window._openQuickView) window._openQuickView(productId);
    });
  });

  document.querySelectorAll("[data-action=view-product]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const t = e.currentTarget;
      const name = t.getAttribute("data-product-name");
      const image = t.getAttribute("data-product-image");
      const desc = t.getAttribute("data-product-desc");
      if (name && image && desc) goToProduct(name, image, desc);
    });
  });

  document.querySelectorAll("[data-action=navigate]").forEach((button) => {
    button.addEventListener("click", (e) => {
      const href = e.currentTarget.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  });
}

// ============= INITIALIZATION =============
document.addEventListener("DOMContentLoaded", () => {
  bindPageActions();
  initQuickView();
  if (document.getElementById("productName")) initProductPage();
  if (document.getElementById("cartContainer")) initCartPage();
});
