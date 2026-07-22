(function () {
  const stateKey = "__cyPinnedPosts";

  if (window[stateKey]) {
    window[stateKey].init();
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    controls: null,
    handleNext: null,
    handlePrev: null,
    next: null,
    prev: null,
    resizeObserver: null,
    updateFrame: 0,
    viewport: null
  };

  const updateControls = function () {
    state.updateFrame = 0;
    if (!state.viewport || !state.controls || !state.prev || !state.next) return;

    const maxScroll = Math.max(0, state.viewport.scrollWidth - state.viewport.clientWidth);
    const hasOverflow = maxScroll > 2;
    const atStart = state.viewport.scrollLeft <= 2;
    const atEnd = state.viewport.scrollLeft >= maxScroll - 2;

    state.controls.hidden = !hasOverflow;
    state.prev.disabled = !hasOverflow || atStart;
    state.next.disabled = !hasOverflow || atEnd;
  };

  const scheduleUpdate = function () {
    if (state.updateFrame) return;
    state.updateFrame = window.requestAnimationFrame(updateControls);
  };

  const scrollByPage = function (direction) {
    if (!state.viewport) return;

    const distance = Math.max(240, Math.round(state.viewport.clientWidth * 0.88));
    state.viewport.scrollBy({
      left: distance * direction,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  };

  const handleKeydown = function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    scrollByPage(event.key === "ArrowLeft" ? -1 : 1);
  };

  const teardown = function () {
    if (state.updateFrame) window.cancelAnimationFrame(state.updateFrame);
    if (state.resizeObserver) state.resizeObserver.disconnect();

    if (state.viewport) {
      state.viewport.removeEventListener("scroll", scheduleUpdate);
      state.viewport.removeEventListener("keydown", handleKeydown);
    }
    if (state.prev && state.handlePrev) state.prev.removeEventListener("click", state.handlePrev);
    if (state.next && state.handleNext) state.next.removeEventListener("click", state.handleNext);
    window.removeEventListener("resize", scheduleUpdate);

    state.controls = null;
    state.handleNext = null;
    state.handlePrev = null;
    state.next = null;
    state.prev = null;
    state.resizeObserver = null;
    state.updateFrame = 0;
    state.viewport = null;
  };

  const init = function () {
    teardown();

    const viewport = document.querySelector("[data-pinned-viewport]");
    if (!viewport) return;

    const section = viewport.closest(".cy-pinned-posts");
    const controls = section && section.querySelector("[data-pinned-controls]");
    const prev = controls && controls.querySelector("[data-pinned-prev]");
    const next = controls && controls.querySelector("[data-pinned-next]");
    if (!section || !controls || !prev || !next) return;

    state.viewport = viewport;
    state.controls = controls;
    state.prev = prev;
    state.next = next;
    state.handlePrev = function () { scrollByPage(-1); };
    state.handleNext = function () { scrollByPage(1); };

    viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
    viewport.addEventListener("keydown", handleKeydown);
    prev.addEventListener("click", state.handlePrev);
    next.addEventListener("click", state.handleNext);

    if ("ResizeObserver" in window) {
      state.resizeObserver = new ResizeObserver(scheduleUpdate);
      state.resizeObserver.observe(viewport);
      const track = viewport.querySelector(".cy-pinned-posts__track");
      if (track) state.resizeObserver.observe(track);
    } else {
      window.addEventListener("resize", scheduleUpdate, { passive: true });
    }

    updateControls();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:send", teardown);
  document.addEventListener("pjax:complete", init);

  window[stateKey] = {
    init: init,
    update: updateControls
  };

  init();
})();
