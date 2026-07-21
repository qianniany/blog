(function () {
  const stateKey = "__cyMikuCursor";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const finePointer = window.matchMedia("(any-pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const interactiveSelector = [
    "a", "button", "select", "summary", "label", "[role='button']", "[role='menuitem']",
    "input[type='button']", "input[type='submit']", "input[type='reset']", "input[type='checkbox']",
    "input[type='radio']", "input[type='range']", "input[type='color']", ".post-card", ".aplayer",
    "#rightside > div"
  ].join(",");
  const nativeCursorSelector = [
    "textarea", "[contenteditable='true']", "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color'])",
    "[disabled]", "[aria-disabled='true']", "[aria-busy='true']", ".cy-cursor-busy", "[draggable='true']",
    "[data-cy-cursor]"
  ].join(",");

  const state = {
    currentType: "",
    cursor: null,
    image: null,
    lastX: 0,
    lastY: 0
  };

  const rootPath = function () {
    const root = typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.root;
    return root || "/blog/";
  };

  const assetUrl = function (name) {
    return rootPath() + "img/cursor/miku/" + name;
  };

  const setHidden = function (hidden) {
    if (state.cursor) state.cursor.classList.toggle("is-hidden", hidden);
  };

  const setCursorType = function (type) {
    const format = reducedMotion.matches ? "png" : "webp";
    const key = type + ":" + format;
    if (!state.image || state.currentType === key) return;

    state.currentType = key;
    state.image.dataset.fallback = assetUrl(type + ".png");
    state.image.src = assetUrl(type + "." + format);
  };

  const ensureCursor = function () {
    if (state.cursor && state.cursor.isConnected) return;

    const cursor = document.createElement("div");
    const image = document.createElement("img");

    cursor.id = "cy-miku-cursor";
    cursor.className = "is-hidden";
    cursor.setAttribute("aria-hidden", "true");
    image.alt = "";
    image.draggable = false;
    image.decoding = "async";
    image.addEventListener("error", function () {
      const fallback = image.dataset.fallback;
      if (fallback && image.src !== new URL(fallback, window.location.href).href) image.src = fallback;
    });
    cursor.appendChild(image);
    document.body.appendChild(cursor);

    state.cursor = cursor;
    state.image = image;
    state.currentType = "";
  };

  const disable = function () {
    document.body.classList.remove("cy-miku-cursor-enabled");
    setHidden(true);
  };

  const refresh = function () {
    if (!finePointer.matches) {
      disable();
      return;
    }

    ensureCursor();
    document.body.classList.add("cy-miku-cursor-enabled");
    state.currentType = "";
    setCursorType("normal");
  };

  const handlePointerMove = function (event) {
    if (!finePointer.matches || !state.cursor || !(event.target instanceof Element)) return;

    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.cursor.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0)";

    if (event.target.closest("#cy-context-menu")) {
      setCursorType("link");
      setHidden(false);
      return;
    }

    if (event.target.closest(nativeCursorSelector)) {
      setHidden(true);
      return;
    }

    setCursorType(event.target.closest(interactiveSelector) ? "link" : "normal");
    setHidden(false);
  };

  const handlePointerDown = function (event) {
    if (event.button === 0 && state.cursor && !state.cursor.classList.contains("is-hidden")) {
      state.cursor.classList.add("is-pressed");
    }
  };

  const handlePointerUp = function () {
    if (state.cursor) state.cursor.classList.remove("is-pressed");
  };

  const handlePointerOut = function (event) {
    if (!event.relatedTarget) setHidden(true);
  };

  const handleVisibility = function () {
    if (document.hidden) setHidden(true);
  };

  document.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("pointerdown", handlePointerDown, { passive: true });
  document.addEventListener("pointerup", handlePointerUp, { passive: true });
  document.addEventListener("pointercancel", handlePointerUp, { passive: true });
  document.addEventListener("pointerout", handlePointerOut, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  document.addEventListener("DOMContentLoaded", refresh);
  document.addEventListener("pjax:send", function () { setHidden(true); });
  document.addEventListener("pjax:complete", refresh);
  finePointer.addEventListener("change", refresh);
  reducedMotion.addEventListener("change", refresh);

  window[stateKey] = {
    refresh: refresh
  };

  refresh();
})();
