(function () {
  const stateKey = "__cyInfinitePosts";

  if (window[stateKey]) {
    window[stateKey].init();
    return;
  }

  const state = {
    controller: null,
    grid: null,
    loading: false,
    loadedPages: new Set(),
    loadedPosts: new Set(),
    nextUrl: null,
    observer: null,
    sentinel: null,
    session: 0,
    wrapper: null
  };

  const normalizeUrl = function (value, base) {
    if (!value) return null;

    try {
      const url = new URL(value, base || window.location.href);
      url.hash = "";
      return url.href;
    } catch (error) {
      return null;
    }
  };

  const findNextUrl = function (root, base) {
    const link = root.querySelector("#pagination a.extend.next[rel='next'], #pagination a.extend.next");
    return link ? normalizeUrl(link.getAttribute("href"), base) : null;
  };

  const collectPostUrls = function () {
    state.loadedPosts.clear();
    state.grid.querySelectorAll(".post-card[href]").forEach(function (card) {
      const url = normalizeUrl(card.getAttribute("href"));
      if (url) state.loadedPosts.add(url);
    });
  };

  const setStatus = function (mode, message) {
    if (!state.sentinel) return;

    state.sentinel.className = "cy-infinite-status cy-infinite-status--" + mode;
    state.sentinel.replaceChildren();

    if (mode === "loading") {
      const spinner = document.createElement("span");
      spinner.className = "cy-infinite-status__spinner";
      spinner.setAttribute("aria-hidden", "true");
      state.sentinel.appendChild(spinner);
    }

    const text = document.createElement("span");
    text.textContent = message;
    state.sentinel.appendChild(text);

    if (mode === "error") {
      const retry = document.createElement("button");
      const retryIcon = document.createElement("i");
      const retryText = document.createElement("span");

      retry.type = "button";
      retry.className = "cy-infinite-status__retry";
      retryIcon.className = "fas fa-redo-alt";
      retryIcon.setAttribute("aria-hidden", "true");
      retryText.textContent = "重试";
      retry.append(retryIcon, retryText);
      retry.addEventListener("click", loadNextPage, { once: true });
      state.sentinel.appendChild(retry);
    }
  };

  const refreshInsertedContent = function () {
    if (window.lazyLoadInstance && typeof window.lazyLoadInstance.update === "function") {
      window.lazyLoadInstance.update();
    }

    if (window.__cyScrollEffects && typeof window.__cyScrollEffects.refresh === "function") {
      window.__cyScrollEffects.refresh();
    }

    if (window.pjax && typeof window.pjax.refresh === "function") {
      window.pjax.refresh(state.grid);
    }
  };

  const finish = function () {
    if (state.observer) state.observer.disconnect();
    setStatus("done", "已加载全部 " + state.loadedPosts.size + " 篇文章");
  };

  async function loadNextPage() {
    if (state.loading || !state.grid || !state.sentinel) return;
    if (!state.nextUrl || state.loadedPages.has(state.nextUrl)) {
      finish();
      return;
    }

    state.loading = true;
    if (state.observer) state.observer.unobserve(state.sentinel);
    setStatus("loading", "正在加载更多文章...");

    const requestUrl = state.nextUrl;
    const activeSession = state.session;
    state.controller = "AbortController" in window ? new AbortController() : null;

    try {
      const response = await fetch(requestUrl, {
        credentials: "same-origin",
        signal: state.controller ? state.controller.signal : undefined
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const html = await response.text();
      if (activeSession !== state.session || !state.grid) return;

      const parsed = new DOMParser().parseFromString(html, "text/html");
      const cards = parsed.querySelectorAll(".home-card-page .post-card-grid .post-card[href]");
      const fragment = document.createDocumentFragment();
      let added = 0;

      cards.forEach(function (card) {
        const postUrl = normalizeUrl(card.getAttribute("href"), requestUrl);
        if (!postUrl || state.loadedPosts.has(postUrl)) return;

        state.loadedPosts.add(postUrl);
        fragment.appendChild(document.importNode(card, true));
        added += 1;
      });

      state.loadedPages.add(requestUrl);
      state.nextUrl = findNextUrl(parsed, requestUrl);

      if (added > 0) {
        state.grid.appendChild(fragment);
        refreshInsertedContent();
      }

      if (!state.nextUrl || state.loadedPages.has(state.nextUrl)) {
        finish();
      } else {
        setStatus("ready", "更多文章");
        if (state.observer) state.observer.observe(state.sentinel);
      }
    } catch (error) {
      if (error.name !== "AbortError" && activeSession === state.session) {
        setStatus("error", "加载失败，请检查网络后重试");
      }
    } finally {
      if (activeSession === state.session) {
        state.loading = false;
        state.controller = null;
      }
    }
  }

  const teardown = function () {
    state.session += 1;
    state.loading = false;

    if (state.controller) state.controller.abort();
    if (state.observer) state.observer.disconnect();

    if (state.wrapper) state.wrapper.classList.remove("is-infinite-ready");
    if (state.sentinel && state.sentinel.isConnected) state.sentinel.remove();

    state.controller = null;
    state.grid = null;
    state.nextUrl = null;
    state.observer = null;
    state.sentinel = null;
    state.wrapper = null;
    state.loadedPages.clear();
    state.loadedPosts.clear();
  };

  const init = function () {
    teardown();

    const grid = document.querySelector(".home-card-page .post-card-grid");
    if (!grid || !("fetch" in window) || !("DOMParser" in window) || !("IntersectionObserver" in window)) return;

    state.grid = grid;
    state.wrapper = grid.closest(".home-card-page");
    state.nextUrl = findNextUrl(document, window.location.href);
    state.loadedPages.add(normalizeUrl(window.location.href));
    collectPostUrls();

    state.sentinel = document.createElement("div");
    state.sentinel.className = "cy-infinite-status cy-infinite-status--ready";
    state.sentinel.setAttribute("role", "status");
    state.sentinel.setAttribute("aria-live", "polite");
    state.wrapper.appendChild(state.sentinel);
    state.wrapper.classList.add("is-infinite-ready");

    if (!state.nextUrl) {
      finish();
      return;
    }

    setStatus("ready", "更多文章");
    state.observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) loadNextPage();
    }, { rootMargin: "0px 0px 600px 0px", threshold: 0 });
    state.observer.observe(state.sentinel);
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:send", teardown);
  document.addEventListener("pjax:complete", init);

  window[stateKey] = {
    init: init,
    loadNextPage: loadNextPage
  };

  init();
})();
