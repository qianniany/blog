(function () {
  const stateKey = "__cyContextMenu";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const finePointer = window.matchMedia("(any-pointer: fine)");
  const items = [
    { action: "home", icon: "fas fa-house", label: "\u8fd4\u56de\u4e3b\u9875", group: 0 },
    { action: "back", icon: "fas fa-arrow-left", label: "\u540e\u9000", group: 0 },
    { action: "search", icon: "fas fa-search", label: "\u641c\u7d22\u6587\u7ae0", group: 1 },
    { action: "random", icon: "fas fa-dice-d20", label: "\u968f\u673a\u6587\u7ae0", group: 1 },
    { action: "theme", icon: "fas fa-adjust", label: "\u5207\u6362\u6df1\u6d45\u4e3b\u9898", group: 2 },
    { action: "palette", icon: "fas fa-palette", label: "\u5207\u6362\u4e3b\u9898\u8863\u6a71", group: 2 },
    { action: "copy-selection", icon: "fas fa-copy", label: "\u590d\u5236\u9009\u4e2d\u5185\u5bb9", group: 3 },
    { action: "paste", icon: "fas fa-paste", label: "\u7c98\u8d34\u5230\u6b64\u5904", group: 3 },
    { action: "top", icon: "fas fa-arrow-up", label: "\u56de\u5230\u9876\u90e8", group: 4 },
    { action: "copy", icon: "fas fa-link", label: "\u590d\u5236\u5f53\u524d\u94fe\u63a5", group: 4 }
  ];

  const state = {
    contextTarget: null,
    feedbackTimer: 0,
    inputSelection: null,
    menu: null,
    previousFocus: null,
    selectionRange: null,
    selectionText: ""
  };

  const rootPath = function () {
    const root = typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.root;
    return root || "/blog/";
  };

  const normalizePath = function (value) {
    return String(value || "").replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  };

  const createMenu = function () {
    if (state.menu && state.menu.isConnected) return state.menu;

    const menu = document.createElement("div");
    let previousGroup = items[0].group;

    menu.id = "cy-context-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "\u9875\u9762\u5feb\u6377\u83dc\u5355");

    items.forEach(function (item) {
      if (item.group !== previousGroup) {
        const separator = document.createElement("div");
        separator.className = "cy-context-menu__separator";
        separator.setAttribute("role", "separator");
        menu.appendChild(separator);
        previousGroup = item.group;
      }

      const button = document.createElement("button");
      const icon = document.createElement("i");
      const label = document.createElement("span");

      button.type = "button";
      button.className = "cy-context-menu__item";
      button.dataset.action = item.action;
      button.setAttribute("role", "menuitem");
      button.tabIndex = -1;
      icon.className = item.icon;
      icon.setAttribute("aria-hidden", "true");
      label.textContent = item.label;
      button.append(icon, label);
      menu.appendChild(button);
    });

    menu.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-action]");
      if (!button || button.disabled) return;
      runAction(button.dataset.action);
    });
    menu.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    menu.addEventListener("keydown", handleMenuKeydown);
    document.body.appendChild(menu);
    state.menu = menu;
    return menu;
  };

  const getButtons = function () {
    return state.menu ? Array.from(state.menu.querySelectorAll("button[data-action]")) : [];
  };

  const setActionEnabled = function (action, enabled) {
    const button = state.menu && state.menu.querySelector("[data-action='" + action + "']");
    if (button) button.disabled = !enabled;
  };

  const getEditableTarget = function () {
    if (!(state.contextTarget instanceof Element)) return null;

    const target = state.contextTarget.closest("input, textarea, [contenteditable='true']");
    if (!target || target.disabled || target.readOnly || target.getAttribute("aria-disabled") === "true") return null;
    return target;
  };

  const isTextControl = function (target) {
    if (!target) return false;
    if (target.tagName === "TEXTAREA") return true;
    if (target.tagName !== "INPUT") return false;
    return /^(?:text|search|url|tel|email|password)$/i.test(target.type || "text");
  };

  const captureContext = function (target) {
    state.contextTarget = target;
    state.inputSelection = null;
    state.selectionRange = null;
    state.selectionText = "";

    const editable = getEditableTarget();
    if (isTextControl(editable)) {
      const start = editable.selectionStart || 0;
      const end = editable.selectionEnd || 0;
      state.inputSelection = { start: start, end: end };
      state.selectionText = editable.value.slice(start, end);
      return;
    }

    const selection = window.getSelection && window.getSelection();
    if (selection && selection.rangeCount && !selection.isCollapsed) {
      state.selectionText = selection.toString();
      state.selectionRange = selection.getRangeAt(0).cloneRange();
    }
  };

  const updateActions = function () {
    setActionEnabled("home", normalizePath(window.location.pathname) !== normalizePath(rootPath()));
    setActionEnabled("back", window.history.length > 1);
    setActionEnabled("search", !!document.querySelector("#search-button > .search"));
    setActionEnabled("random", !!document.getElementById("cy-random-post"));
    setActionEnabled("theme", !!document.getElementById("darkmode"));
    setActionEnabled("palette", !!document.getElementById("cy-palette-toggle"));
    setActionEnabled("copy-selection", !!state.selectionText);
    setActionEnabled("paste", !!getEditableTarget() && !!navigator.clipboard && window.isSecureContext);
    setActionEnabled("top", window.scrollY > 12);
    setActionEnabled("copy", true);
  };

  const close = function (restoreFocus) {
    if (!state.menu || state.menu.hidden) return;

    state.menu.hidden = true;
    state.menu.classList.remove("is-open");

    if (restoreFocus && state.previousFocus && state.previousFocus.isConnected) {
      state.previousFocus.focus({ preventScroll: true });
    }
  };

  const open = function (x, y) {
    const menu = createMenu();
    state.previousFocus = document.activeElement;
    updateActions();

    menu.hidden = false;
    menu.classList.add("is-open");
    menu.style.left = "-9999px";
    menu.style.top = "-9999px";

    const bounds = menu.getBoundingClientRect();
    const edge = 12;
    const cursorSize = 64;
    const cursorGap = 10;
    const rightOfCursor = x + cursorSize + cursorGap;
    const leftOfCursor = x - bounds.width - cursorGap;
    const fitsRight = rightOfCursor + bounds.width <= window.innerWidth - edge;
    const fitsLeft = leftOfCursor >= edge;
    let left;

    if (fitsRight) left = rightOfCursor;
    else if (fitsLeft) left = leftOfCursor;
    else left = Math.max(edge, Math.min(rightOfCursor, window.innerWidth - bounds.width - edge));

    const top = Math.max(edge, Math.min(y, window.innerHeight - bounds.height - edge));
    menu.style.left = left + "px";
    menu.style.top = top + "px";

    const first = getButtons().find(function (button) { return !button.disabled; });
    if (first) first.focus({ preventScroll: true });
  };

  const showFeedback = function (message, failed) {
    let feedback = document.getElementById("cy-context-feedback");

    if (!feedback) {
      feedback = document.createElement("div");
      feedback.id = "cy-context-feedback";
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.classList.toggle("is-error", !!failed);
    feedback.classList.add("is-show");
    window.clearTimeout(state.feedbackTimer);
    state.feedbackTimer = window.setTimeout(function () {
      feedback.classList.remove("is-show");
    }, 1800);
  };

  const writeClipboard = async function (value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("copy command failed");
  };

  const copyText = async function (value, successMessage) {
    try {
      await writeClipboard(value);
      showFeedback(successMessage, false);
    } catch (error) {
      showFeedback("\u590d\u5236\u5931\u8d25", true);
    }
  };

  const pasteText = async function () {
    const target = getEditableTarget();
    if (!target || !navigator.clipboard || !window.isSecureContext) return;

    try {
      const value = await navigator.clipboard.readText();
      target.focus({ preventScroll: true });

      if (isTextControl(target)) {
        const selection = state.inputSelection || { start: target.selectionStart, end: target.selectionEnd };
        target.setRangeText(value, selection.start, selection.end, "end");
      } else {
        const range = state.selectionRange;
        if (range && target.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          const node = document.createTextNode(value);
          range.insertNode(node);
          range.setStartAfter(node);
          range.collapse(true);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          target.appendChild(document.createTextNode(value));
        }
      }

      target.dispatchEvent(new Event("input", { bubbles: true }));
      showFeedback("\u5185\u5bb9\u5df2\u7c98\u8d34", false);
    } catch (error) {
      showFeedback("\u65e0\u6cd5\u8bfb\u53d6\u526a\u8d34\u677f", true);
    }
  };

  const trigger = function (selector) {
    const target = document.querySelector(selector);
    if (!target) return false;
    target.click();
    return true;
  };

  async function runAction(action) {
    close(true);

    if (action === "home") {
      if (window.pjax && typeof window.pjax.loadUrl === "function") window.pjax.loadUrl(rootPath());
      else window.location.href = rootPath();
      return;
    }
    if (action === "back") {
      window.history.back();
      return;
    }
    if (action === "search") {
      trigger("#search-button > .search");
      return;
    }
    if (action === "random") {
      trigger("#cy-random-post");
      return;
    }
    if (action === "theme") {
      trigger("#darkmode");
      return;
    }
    if (action === "palette") {
      trigger("#cy-palette-toggle");
      return;
    }
    if (action === "top") {
      trigger("#go-up");
      return;
    }
    if (action === "copy-selection") {
      await copyText(state.selectionText, "\u9009\u4e2d\u5185\u5bb9\u5df2\u590d\u5236");
      return;
    }
    if (action === "paste") {
      await pasteText();
      return;
    }
    if (action === "copy") await copyText(window.location.href, "\u94fe\u63a5\u5df2\u590d\u5236");
  }

  function handleMenuKeydown(event) {
    const buttons = getButtons().filter(function (button) { return !button.disabled; });
    if (!buttons.length) return;

    const current = buttons.indexOf(document.activeElement);
    let next = current;

    if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
    else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    } else return;

    event.preventDefault();
    buttons[next].focus({ preventScroll: true });
  }

  const handleContextMenu = function (event) {
    if (!finePointer.matches || !(event.target instanceof Element)) return;
    if (event.target.closest("#cy-context-menu")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    captureContext(event.target);
    open(event.clientX, event.clientY);
  };

  const handleOutsidePointer = function (event) {
    if (state.menu && !state.menu.hidden && !state.menu.contains(event.target)) close(false);
  };

  const refresh = function () {
    createMenu();
    if (!finePointer.matches) close(false);
  };

  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("pointerdown", handleOutsidePointer, true);
  document.addEventListener("DOMContentLoaded", refresh);
  document.addEventListener("pjax:send", function () { close(false); });
  document.addEventListener("pjax:complete", refresh);
  window.addEventListener("scroll", function () { close(false); }, { passive: true });
  window.addEventListener("resize", function () { close(false); });
  finePointer.addEventListener("change", refresh);

  window[stateKey] = {
    close: close,
    refresh: refresh
  };

  refresh();
})();
