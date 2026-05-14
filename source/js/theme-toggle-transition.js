(function () {
  const stateKey = "__cyThemeToggleTransition";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const state = {
    running: false,
    toastTimer: 0
  };

  const getTheme = function () {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  };

  const setButtonIcon = function () {
    const button = document.getElementById("darkmode");
    if (!button) return;

    const icon = button.querySelector("i");
    if (!icon) return;

    icon.className = getTheme() === "dark" ? "fas fa-sun" : "fas fa-moon";
  };

  const runThemeCallbacks = function (mode) {
    const themeChange = (window.globalFn && window.globalFn.themeChange) || {};

    Object.keys(themeChange).forEach(function (key) {
      if (typeof themeChange[key] === "function") {
        themeChange[key](mode);
      }
    });
  };

  const saveTheme = function (mode) {
    if (window.btf && window.btf.saveToLocal) {
      window.btf.saveToLocal.set("theme", mode, 2);
      return;
    }

    const expiry = Date.now() + 2 * 86400000;
    localStorage.setItem("theme", JSON.stringify({ value: mode, expiry: expiry }));
  };

  const applyTheme = function (mode) {
    if (mode === "dark" && window.btf && typeof window.btf.activateDarkMode === "function") {
      window.btf.activateDarkMode();
    } else if (mode === "light" && window.btf && typeof window.btf.activateLightMode === "function") {
      window.btf.activateLightMode();
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }

    saveTheme(mode);
    setButtonIcon();
    runThemeCallbacks(mode);
  };

  const createSky = function (nextMode) {
    const oldSky = document.querySelector(".Cuteen_DarkSky");
    if (oldSky) oldSky.remove();

    const sky = document.createElement("div");
    sky.className = "Cuteen_DarkSky";
    sky.setAttribute("aria-hidden", "true");

    if (nextMode === "dark") {
      sky.classList.add("is-to-dark");
    } else {
      sky.classList.add("is-to-light");
    }

    sky.innerHTML = '<div class="Cuteen_DarkPlanet"><div class="Cuteen_Sun"></div><div class="Cuteen_Moon"></div></div>';
    document.body.appendChild(sky);

    requestAnimationFrame(function () {
      sky.classList.add("is-active");
    });

    return sky;
  };

  const showToast = function () {
    let toast = document.querySelector(".cy-theme-toggle-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "cy-theme-toggle-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = "\u8bf7\u52ff\u9891\u7e41\u5207\u6362";
    toast.classList.add("is-show");

    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-show");
    }, 1600);
  };

  const startTransition = function () {
    state.running = true;

    const currentMode = getTheme();
    const nextMode = currentMode === "dark" ? "light" : "dark";
    const sky = createSky(nextMode);

    window.setTimeout(function () {
      applyTheme(nextMode);
      sky.classList.add("is-fading");
    }, 920);

    window.setTimeout(function () {
      sky.remove();
      state.running = false;
    }, 2600);
  };

  const switchWithTransition = function (event) {
    const button = event.target.closest && event.target.closest("#darkmode");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (state.running) {
      showToast();
      return;
    }

    startTransition();
  };

  const refresh = function () {
    setButtonIcon();
  };

  document.addEventListener("click", switchWithTransition, true);
  document.addEventListener("DOMContentLoaded", refresh);
  document.addEventListener("pjax:complete", refresh);

  window[stateKey] = {
    refresh: refresh
  };

  refresh();
})();
