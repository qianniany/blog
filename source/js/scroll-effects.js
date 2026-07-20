(function () {
  const stateKey = "__cyScrollEffects";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const state = {
    progressBar: null,
    ticking: false,
    observer: null
  };

  const prefersReducedMotion = function () {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const isPostPage = function () {
    return !!document.getElementById("post");
  };

  const ensureProgressBar = function () {
    let bar = document.getElementById("cy-reading-progress");

    if (!bar) {
      bar = document.createElement("div");
      bar.id = "cy-reading-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }

    state.progressBar = bar;
    bar.style.display = isPostPage() ? "block" : "none";
  };

  const updateProgress = function () {
    if (!state.progressBar || !isPostPage()) return;

    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
    state.progressBar.style.width = (progress * 100) + "%";
  };

  const requestProgressUpdate = function () {
    if (state.ticking) return;

    state.ticking = true;
    window.requestAnimationFrame(function () {
      updateProgress();
      state.ticking = false;
    });
  };

  const setupReveal = function () {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }

    const targets = document.querySelectorAll(".recent-post-item, .card-widget:not(#card-toc)");
    if (!targets.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      for (let index = 0; index < targets.length; index += 1) {
        targets[index].classList.add("is-visible");
        targets[index].style.willChange = "auto";
      }
      return;
    }

    state.observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        state.observer.unobserve(entry.target);

        window.setTimeout(function () {
          entry.target.style.transitionDelay = "";
          entry.target.style.willChange = "auto";
        }, 700);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    targets.forEach(function (target, index) {
      if (target.classList.contains("is-visible")) return;

      target.classList.add("cy-reveal");
      target.style.willChange = "opacity, transform";
      target.style.transitionDelay = Math.min(index % 5, 4) * 70 + "ms";
      state.observer.observe(target);
    });
  };

  const refresh = function () {
    ensureProgressBar();
    updateProgress();
    setupReveal();
  };

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate);
  document.addEventListener("DOMContentLoaded", refresh);
  window.addEventListener("load", refresh);
  document.addEventListener("pjax:complete", refresh);

  window[stateKey] = {
    refresh: refresh
  };

  refresh();
})();
