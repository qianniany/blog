(function () {
  const stateKey = "__cyClickEffects";
  if (window[stateKey]) return;

  const ignoredSelector = [
    "a", "button", "input", "textarea", "select", "option", "label", "summary",
    "[role='button']", "[contenteditable='true']", "#nav", "#sidebar", "#aside-content",
    ".post-card", ".recent-post-item", "#post", "#page", ".card-widget", ".aplayer",
    "#rightside", "img", "video", "audio", "canvas", "svg"
  ].join(",");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactPointer = window.matchMedia("(max-width: 768px), (pointer: coarse)");
  const maxParticles = 28;

  const layer = document.createElement("div");
  layer.id = "cy-click-effects";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const removeParticle = function (particle) {
    if (particle && particle.isConnected) particle.remove();
  };

  const trimParticles = function () {
    while (layer.childElementCount >= maxParticles) {
      layer.firstElementChild.remove();
    }
  };

  const spawnParticle = function (x, y, index, total) {
    trimParticles();

    const isNote = compactPointer.matches ? index === total - 1 : index >= 4;
    const particle = document.createElement("span");
    const angle = (-145 + (290 / Math.max(total - 1, 1)) * index) * Math.PI / 180;
    const distance = (compactPointer.matches ? 36 : 48) + (index % 3) * 8;

    particle.className = "cy-click-particle " + (isNote ? "cy-click-particle--note" : "cy-click-particle--petal");
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty("--cy-click-x", Math.cos(angle) * distance + "px");
    particle.style.setProperty("--cy-click-y", Math.sin(angle) * distance + "px");
    particle.style.setProperty("--cy-click-rotate", (-85 + index * 43) + "deg");
    particle.style.setProperty("--cy-click-delay", (index % 3) * 18 + "ms");
    particle.style.setProperty("--cy-click-size", (isNote ? 13 + index % 2 * 3 : 8 + index % 3 * 2) + "px");

    if (isNote) particle.textContent = index % 2 ? "♫" : "♪";

    particle.addEventListener("animationend", function () {
      removeParticle(particle);
    }, { once: true });
    window.setTimeout(function () { removeParticle(particle); }, 900);
    layer.appendChild(particle);
  };

  const handleClick = function (event) {
    if (event.button !== 0 || reducedMotion.matches || event.defaultPrevented) return;
    if (!(event.target instanceof Element) || event.target.closest(ignoredSelector)) return;

    const count = compactPointer.matches ? 4 : 7;
    for (let index = 0; index < count; index += 1) {
      spawnParticle(event.clientX, event.clientY, index, count);
    }
  };

  document.addEventListener("click", handleClick);

  window[stateKey] = {
    layer: layer
  };
})();
