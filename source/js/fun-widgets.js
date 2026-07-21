(function () {
  const stateKey = "__cyFunWidgets";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const WEATHER_KEY = "cy_weather_v1";
  const PALETTE_KEY = "cy_palette_v2";
  const WEATHER_TTL = 30 * 60 * 1000;
  const SHANGHAI = { latitude: 31.23, longitude: 121.47, label: "上海" };
  const PALETTES = ["miku", "sakura", "violet"];
  const PALETTE_NAMES = {
    miku: "初音冰蓝",
    sakura: "樱花粉",
    violet: "星夜紫"
  };
  const DAILY_LINES = [
    "把今天的灵感也写进歌里吧。",
    "愿每一次编译，都有清澈的回声。",
    "代码与旋律，都值得慢慢打磨。",
    "星光已连接，继续创造新的世界。",
    "今天也要保持 39% 的可爱和 61% 的专注。"
  ];

  const state = {
    weatherRequest: null,
    postsPromise: null,
    clockTimer: 0,
    toastTimer: 0
  };

  const rootPath = function () {
    const root = typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.root;
    return root || "/blog/";
  };

  const readJson = function (key) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  };

  const writeJson = function (key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage can be disabled without breaking the widgets.
    }
  };

  const writeValue = function (key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Storage can be disabled without breaking the widgets.
    }
  };

  const readValue = function (key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const select = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  const setText = function (root, selector, value) {
    const element = select(selector, root);
    if (element) element.textContent = value;
  };

  const showToast = function (message) {
    let toast = document.querySelector(".cy-fun-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "cy-fun-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-show");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-show");
    }, 2200);
  };

  const weatherMeta = function (code, isDay) {
    if (code === 0) return { icon: isDay ? "☀" : "☾", label: isDay ? "晴朗" : "晴夜" };
    if (code === 1 || code === 2) return { icon: "⛅", label: "少云" };
    if (code === 3) return { icon: "☁", label: "多云" };
    if (code === 45 || code === 48) return { icon: "≋", label: "有雾" };
    if (code >= 51 && code <= 57) return { icon: "☂", label: "细雨" };
    if (code >= 61 && code <= 67) return { icon: "☔", label: "降雨" };
    if (code >= 71 && code <= 77) return { icon: "❄", label: "降雪" };
    if (code >= 80 && code <= 82) return { icon: "☔", label: "阵雨" };
    if (code >= 85 && code <= 86) return { icon: "❄", label: "阵雪" };
    if (code >= 95) return { icon: "ϟ", label: "雷雨" };
    return { icon: "♪", label: "天气未知" };
  };

  const weatherSpeech = function (current, meta) {
    const temperature = Number(current.temperature_2m);
    const code = Number(current.weather_code);

    if (!current.is_day) return "夜色频道已接通，记得给今天留一点休息时间。";
    if (code >= 95) return "雷声正在打节拍，外出时请注意安全。";
    if (code >= 71 && code <= 86) return "雪花正在伴奏，今天适合收集一点冬日灵感。";
    if (code >= 51 && code <= 82) return "雨声轨道已加载，别忘了带伞。";
    if (temperature >= 32) return "高温提示：补充水分后，再继续今天的创作。";
    if (temperature <= 5) return "气温偏低，围巾和热饮都是今日推荐装备。";
    if (meta.label === "晴朗") return "阳光频道信号良好，适合开启新的任务。";
    return "天气旋律已经同步，愿今天的状态稳定在线。";
  };

  const updateFooterWeather = function (text) {
    const element = document.querySelector("[data-footer-weather]");
    if (element) element.textContent = text || "天气待连接";
  };

  const renderWeather = function (widget, payload, statusText) {
    if (!widget || !payload || !payload.current) return;

    const current = payload.current;
    const location = payload.location || "当前位置";
    const meta = weatherMeta(Number(current.weather_code), Number(current.is_day) === 1);
    const temperature = Math.round(Number(current.temperature_2m));
    const apparent = Math.round(Number(current.apparent_temperature));
    const wind = Math.round(Number(current.wind_speed_10m));

    widget.dataset.weatherState = Number(current.is_day) === 1 ? "day" : "night";
    setText(widget, "[data-weather-location]", location);
    setText(widget, "[data-weather-icon]", meta.icon);
    setText(widget, "[data-weather-temperature]", temperature + "°");
    setText(widget, "[data-weather-condition]", meta.label);
    setText(widget, "[data-weather-apparent]", "体感 " + apparent + "°");
    setText(widget, "[data-weather-wind]", "风速 " + wind + " km/h");
    setText(widget, "[data-weather-speech]", weatherSpeech(current, meta));
    setText(widget, "[data-weather-status]", statusText || "天气数据已更新");

    const buttonLabel = select("[data-weather-action] span", widget);
    if (buttonLabel) buttonLabel.textContent = "刷新定位";
    updateFooterWeather(location + " · " + temperature + "° " + meta.label);
  };

  const renderWeatherError = function (widget, message) {
    if (!widget) return;
    widget.dataset.weatherState = "error";
    setText(widget, "[data-weather-status]", message);
    setText(widget, "[data-weather-speech]", "天气频道暂时有些杂音，稍后再试一次吧。 ");
    updateFooterWeather("天气暂不可用");
  };

  const setWeatherLoading = function (widget, message) {
    if (!widget) return;
    widget.dataset.weatherState = "loading";
    setText(widget, "[data-weather-status]", message);
    const button = select("[data-weather-action]", widget);
    if (button) button.disabled = true;
  };

  const releaseWeatherButton = function (widget) {
    const button = select("[data-weather-action]", widget);
    if (button) button.disabled = false;
  };

  const fetchWeather = async function (widget, coordinates, location, statusText) {
    if (state.weatherRequest) state.weatherRequest.abort();
    state.weatherRequest = new AbortController();
    const timeout = window.setTimeout(function () {
      if (state.weatherRequest) state.weatherRequest.abort();
    }, 9000);
    const query = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: "temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
      timezone: "auto"
    });

    setWeatherLoading(widget, statusText || "正在连接天气频道…");

    try {
      const response = await window.fetch("https://api.open-meteo.com/v1/forecast?" + query.toString(), {
        signal: state.weatherRequest.signal,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("weather response " + response.status);
      const data = await response.json();
      const payload = {
        location: location,
        coordinates: coordinates,
        current: data.current,
        expiresAt: Date.now() + WEATHER_TTL
      };

      writeJson(WEATHER_KEY, payload);
      renderWeather(widget, payload, "更新于 " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      return payload;
    } catch (error) {
      const cached = readJson(WEATHER_KEY);
      if (cached && cached.current) {
        renderWeather(widget, cached, "网络不可用，显示上次天气");
        return cached;
      }
      renderWeatherError(widget, "天气接口暂时不可用");
      return null;
    } finally {
      window.clearTimeout(timeout);
      state.weatherRequest = null;
      releaseWeatherButton(widget);
    }
  };

  const useShanghaiFallback = function (widget, reason) {
    return fetchWeather(widget, SHANGHAI, "上海", reason + "，已切换上海");
  };

  const requestLocationWeather = function (widget) {
    if (!navigator.geolocation) {
      useShanghaiFallback(widget, "浏览器不支持定位");
      return;
    }

    setWeatherLoading(widget, "等待浏览器定位许可…");
    navigator.geolocation.getCurrentPosition(function (position) {
      const coordinates = {
        latitude: Math.round(position.coords.latitude * 100) / 100,
        longitude: Math.round(position.coords.longitude * 100) / 100
      };
      fetchWeather(widget, coordinates, "当前位置", "定位成功，正在获取天气…");
    }, function (error) {
      const reason = error && error.code === 1 ? "定位未授权" : "定位失败";
      useShanghaiFallback(widget, reason);
    }, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: WEATHER_TTL
    });
  };

  const setupWeather = function () {
    const widget = document.querySelector("#cy-weather-widget .cy-weather");
    if (!widget) return;

    const button = select("[data-weather-action]", widget);
    if (button && !button.dataset.cyBound) {
      button.dataset.cyBound = "true";
      button.addEventListener("click", function () {
        requestLocationWeather(widget);
      });
    }

    const cached = readJson(WEATHER_KEY);
    if (!cached || !cached.current) return;

    if (cached.expiresAt > Date.now()) {
      renderWeather(widget, cached, "使用 30 分钟天气缓存");
      return;
    }

    if (cached.coordinates && !state.weatherRequest) {
      fetchWeather(widget, cached.coordinates, cached.location || "当前位置", "正在刷新缓存天气…");
    }
  };

  const currentPalette = function () {
    const stored = readValue(PALETTE_KEY);
    return PALETTES.indexOf(stored) >= 0 ? stored : "sakura";
  };

  const applyPalette = function (palette, notify) {
    const safePalette = PALETTES.indexOf(palette) >= 0 ? palette : "sakura";
    document.documentElement.setAttribute("data-cy-palette", safePalette);
    writeValue(PALETTE_KEY, safePalette);

    const button = document.getElementById("cy-palette-toggle");
    if (button) {
      button.dataset.palette = safePalette;
      button.title = "主题衣橱：" + PALETTE_NAMES[safePalette];
      button.setAttribute("aria-label", button.title);
    }

    if (notify) showToast("已换装为「" + PALETTE_NAMES[safePalette] + "」");
  };

  const setupPaletteButton = function () {
    const container = document.getElementById("rightside-config-hide") || document.getElementById("rightside-config-show");
    if (!container) return;

    let button = document.getElementById("cy-palette-toggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "cy-palette-toggle";
      button.type = "button";
      button.innerHTML = '<i class="fas fa-palette"></i>';
      container.appendChild(button);
    }

    if (!button.dataset.cyBound) {
      button.dataset.cyBound = "true";
      button.addEventListener("click", function () {
        const active = currentPalette();
        const next = PALETTES[(PALETTES.indexOf(active) + 1) % PALETTES.length];
        applyPalette(next, true);
      });
    }

    applyPalette(currentPalette(), false);
  };

  const ensureFooterStatus = function () {
    const footer = document.getElementById("footer-wrap") || document.getElementById("footer");
    if (!footer) return;

    let status = document.querySelector(".cy-footer-status");
    if (!status) {
      status = document.createElement("div");
      status.className = "cy-footer-status";
      status.innerHTML = [
        '<span><i class="fas fa-satellite-dish"></i><b data-footer-runtime></b></span>',
        '<span><i class="far fa-clock"></i><b data-footer-clock></b></span>',
        '<span><i class="fas fa-cloud-sun"></i><b data-footer-weather>天气待连接</b></span>',
        '<span class="cy-footer-status__line"><i class="fas fa-music"></i><b data-footer-line></b></span>'
      ].join("");
      footer.insertBefore(status, footer.firstChild);
    }

    const start = new Date("2025-01-01T00:00:00+08:00").getTime();
    const days = Math.max(1, Math.floor((Date.now() - start) / 86400000));
    setText(status, "[data-footer-runtime]", "运行 " + days + " 天");
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_LINES.length;
    setText(status, "[data-footer-line]", DAILY_LINES[dayIndex]);

    const updateClock = function () {
      setText(status, "[data-footer-clock]", new Date().toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }));
    };

    updateClock();
    if (!state.clockTimer) state.clockTimer = window.setInterval(updateClock, 60000);

    const cached = readJson(WEATHER_KEY);
    if (cached && cached.current) {
      const meta = weatherMeta(Number(cached.current.weather_code), Number(cached.current.is_day) === 1);
      updateFooterWeather((cached.location || "当前位置") + " · " + Math.round(Number(cached.current.temperature_2m)) + "° " + meta.label);
    }
  };

  const normalizePath = function (value) {
    let path = String(value || "");

    try {
      path = decodeURIComponent(path);
    } catch (error) {
      // Keep the original URL if it contains an invalid escape sequence.
    }

    return path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  };

  const loadPosts = function () {
    if (state.postsPromise) return state.postsPromise;
    state.postsPromise = window.fetch(rootPath() + "fun-posts.json", { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("post manifest " + response.status);
        return response.json();
      })
      .then(function (payload) {
        return Array.isArray(payload.posts) ? payload.posts : [];
      })
      .catch(function () {
        state.postsPromise = null;
        return [];
      });
    return state.postsPromise;
  };

  const openRandomPost = async function (button) {
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add("is-spinning");

    const posts = await loadPosts();
    const current = normalizePath(window.location.pathname);
    const candidates = posts.filter(function (post) {
      return post && post.path && normalizePath(post.path) !== current;
    });

    if (!candidates.length) {
      button.disabled = false;
      button.classList.remove("is-spinning");
      showToast("扭蛋机暂时没有找到其他文章");
      return;
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    showToast("抽中了「" + target.title + "」");
    window.setTimeout(function () {
      if (window.pjax && typeof window.pjax.loadUrl === "function") {
        window.pjax.loadUrl(target.path);
        return;
      }

      window.location.href = target.path;
    }, 620);
  };

  const setupRandomButton = function () {
    const container = document.getElementById("rightside-config-show");
    if (!container) return;

    let button = document.getElementById("cy-random-post");
    if (!button) {
      button = document.createElement("button");
      button.id = "cy-random-post";
      button.type = "button";
      button.title = "随机文章扭蛋";
      button.setAttribute("aria-label", "随机文章扭蛋");
      button.innerHTML = '<i class="fas fa-dice-d20"></i><span>扭蛋</span>';
      const goUp = document.getElementById("go-up");
      container.insertBefore(button, goUp || null);
    }

    if (!button.dataset.cyBound) {
      button.dataset.cyBound = "true";
      button.addEventListener("click", function () {
        openRandomPost(button);
      });
    }
  };

  const refresh = function () {
    setupPaletteButton();
    setupRandomButton();
    ensureFooterStatus();
    setupWeather();
  };

  document.documentElement.setAttribute("data-cy-palette", currentPalette());
  document.addEventListener("DOMContentLoaded", refresh);
  window.addEventListener("load", refresh);
  document.addEventListener("pjax:complete", refresh);

  window[stateKey] = { refresh: refresh };
  refresh();
})();
