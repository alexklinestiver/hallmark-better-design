/* Brookline Together Shop · bag, size pickers, sketch outlines, landmark game.
 * Checkout, contact and newsletter are front-end only: wire them to the
 * store provider (Shopify Buy Button, Square, Printful, etc.) before launch.
 */
(() => {
  "use strict";

  /* PLACEHOLDER PRICES — confirm with Brookline Together before launch. */
  const PRICES = { tee: 28, crew: 45 };
  const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
  const PRODUCTS = {
    cannon:    { name: "The Cannon",    color: "Navy",  img: "./img/cannon-back-800.webp" },
    firehouse: { name: "The Firehouse", color: "White", img: "./img/firehouse-back-800.webp" },
    marquee:   { name: "The Marquee",   color: "Ivory", img: "./img/marquee-back-800.webp" },
  };
  const STYLE_LABEL = { tee: "Tee", crew: "Crewneck" };
  const STORE_KEY = "bt-shop-bag";
  const money = (n) => "$" + n.toFixed(0);

  /* ── Sketch outlines: a wobbly drawn box behind every .sketch control ── */
  const wobble = () => {
    const j = () => (Math.random() * 2.4 - 1.2).toFixed(1);
    return `M${2 + +j()},${4 + +j()} C30,${2 + +j()} 70,${5 + +j()} ${98 + +j()},${3 + +j()} ` +
      `C${99 + +j()},16 ${97 + +j()},28 ${98 + +j()},${37 + +j()} ` +
      `C70,${39 + +j()} 30,${36 + +j()} ${2 + +j()},${38 + +j()} C${1 + +j()},26 ${3 + +j()},14 ${3 + +j()},${2 + +j()}`;
  };
  document.querySelectorAll(".sketch").forEach((el) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sketch__line");
    svg.setAttribute("viewBox", "0 0 100 40");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `<path d="${wobble()}"/><path d="M${6},${39} C40,${41} 70,${38} ${96},${40}"/>`;
    el.appendChild(svg);
  });

  /* ── Bag state ── */
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch (_) { bag = []; }
  if (!Array.isArray(bag)) bag = [];
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(bag)); } catch (_) {} };

  const $count = document.querySelector("[data-bag-count]");
  const $dialog = document.querySelector("[data-bag]");
  const $items = document.querySelector("[data-bag-items]");
  const $empty = document.querySelector("[data-bag-empty]");
  const $foot = document.querySelector("[data-bag-foot]");
  const $total = document.querySelector("[data-bag-total]");
  const $toast = document.querySelector("[data-toast]");
  const $bagTab = document.querySelector("[data-open-bag]");

  const render = () => {
    const qty = bag.reduce((s, l) => s + l.qty, 0);
    $count.textContent = qty;
    $bagTab.setAttribute("aria-label", `Bag, ${qty} item${qty === 1 ? "" : "s"}`);
    $items.innerHTML = "";
    bag.forEach((l, i) => {
      const p = PRODUCTS[l.id];
      if (!p) return;
      const li = document.createElement("li");
      li.className = "line";
      li.innerHTML = `
        <img src="${p.img}" alt="" width="72" height="72" />
        <div>
          <p class="line__name">${p.name}</p>
          <p class="line__meta">${STYLE_LABEL[l.style]} · ${p.color} · ${l.size}</p>
          <div class="line__qty">
            <button type="button" data-dec aria-label="One fewer ${p.name} ${STYLE_LABEL[l.style]}">&minus;</button>
            <output aria-label="Quantity">${l.qty}</output>
            <button type="button" data-inc aria-label="One more ${p.name} ${STYLE_LABEL[l.style]}">+</button>
          </div>
        </div>
        <div class="line__right">
          <p class="line__price">${money(PRICES[l.style] * l.qty)}</p>
          <button type="button" class="line__remove" data-rm>Remove</button>
        </div>`;
      li.querySelector("[data-dec]").addEventListener("click", () => { l.qty = Math.max(1, l.qty - 1); commit(); });
      li.querySelector("[data-inc]").addEventListener("click", () => { l.qty = Math.min(20, l.qty + 1); commit(); });
      li.querySelector("[data-rm]").addEventListener("click", () => { bag.splice(i, 1); commit(); });
      $items.appendChild(li);
    });
    const empty = bag.length === 0;
    $empty.hidden = !empty;
    $foot.hidden = empty;
    $total.textContent = money(bag.reduce((s, l) => s + PRICES[l.style] * l.qty, 0));
  };
  const commit = () => { save(); render(); };

  let toastTimer;
  const toast = (msg) => {
    $toast.textContent = msg;
    $toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove("is-on"), 2600);
  };

  /* ── Product forms ── */
  document.querySelectorAll("[data-product]").forEach((article) => {
    const id = article.dataset.product;
    const form = article.querySelector("[data-buy]");
    const sizes = form.querySelector("[data-sizes]");
    const price = form.querySelector("[data-price]");
    const err = form.querySelector("[data-error]");
    const btn = form.querySelector("button[type=submit]");

    sizes.innerHTML = SIZES.map((s) =>
      `<label><input type="radio" name="size" value="${s}" /><span>${s}</span></label>`).join("");

    const style = () => form.querySelector("input[name=style]:checked").value;
    const syncPrice = () => { price.textContent = money(PRICES[style()]); };
    syncPrice();

    form.addEventListener("change", (e) => {
      if (e.target.name === "style") syncPrice();
      if (e.target.name === "size") { err.hidden = true; form.classList.remove("buy--error"); }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const size = form.querySelector("input[name=size]:checked");
      if (!size) {
        err.hidden = false;
        form.classList.add("buy--error");
        sizes.querySelector("input").focus();
        return;
      }
      const s = style();
      const hit = bag.find((l) => l.id === id && l.style === s && l.size === size.value);
      if (hit) hit.qty = Math.min(20, hit.qty + 1);
      else bag.push({ id, style: s, size: size.value, qty: 1 });
      commit();

      btn.classList.add("is-added");
      btn.textContent = "Added ✓";
      setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = "Add to bag"; }, 1400);
      $bagTab.classList.remove("tab--bump");
      void $bagTab.offsetWidth;
      $bagTab.classList.add("tab--bump");
      toast(`Added ${PRODUCTS[id].name} ${STYLE_LABEL[s].toLowerCase()}, size ${size.value}`);
    });
  });

  /* ── Drawer ── */
  const open = () => { if (typeof $dialog.showModal === "function") $dialog.showModal(); else $dialog.setAttribute("open", ""); };
  const close = () => { if (typeof $dialog.close === "function") $dialog.close(); else $dialog.removeAttribute("open"); };
  $bagTab.addEventListener("click", open);
  document.querySelector("[data-close-bag]").addEventListener("click", close);
  $dialog.addEventListener("click", (e) => { if (e.target === $dialog) close(); });

  document.querySelector("[data-checkout]").addEventListener("click", () => {
    document.querySelector("[data-checkout-status]").textContent =
      "checkout isn't hooked up yet — this preview only holds your bag.";
  });

  /* ── Contact + newsletter (front-end only) ── */
  const contact = document.querySelector("[data-contact]");
  contact.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    contact.querySelectorAll("input, textarea").forEach((f) => {
      const bad = !f.checkValidity();
      f.closest(".field").classList.toggle("is-invalid", bad);
      f.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && ok) { f.focus(); ok = false; }
    });
    document.querySelector("[data-contact-status]").textContent = ok
      ? "got it — thanks! (preview only, nothing was sent)"
      : "fill in all three, please.";
    if (ok) contact.reset();
  });

  const news = document.querySelector("[data-news]");
  news.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = news.querySelector("input");
    document.querySelector("[data-news-status]").textContent = f.checkValidity()
      ? "you're on the list! (preview only)"
      : "that email looks off.";
    if (f.checkValidity()) news.reset();
  });

  /* ── Landmark game ── */
  const finds = [...document.querySelectorAll(".find")];
  const $gc = document.querySelector("[data-game-count]");
  const $win = document.querySelector("[data-game-win]");
  finds.forEach((b) => b.addEventListener("click", () => {
    b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
    const n = finds.filter((x) => x.getAttribute("aria-pressed") === "true").length;
    $gc.textContent = `${n} of ${finds.length} found`;
    $win.hidden = n !== finds.length;
  }));

  render();
})();
