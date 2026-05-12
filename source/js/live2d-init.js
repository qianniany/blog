(function () {
  const models = [
    {
      key: "shizuku",
      name: "Shizuku",
      jsonPath: "https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json"
    },
    {
      key: "miku",
      name: "Miku",
      jsonPath: "https://unpkg.com/live2d-widget-model-miku@1.0.5/assets/miku.model.json"
    },
    {
      key: "haru01",
      name: "Haru",
      jsonPath: "https://unpkg.com/live2d-widget-model-haru@1.0.5/01/assets/haru01.model.json"
    },
    {
      key: "wanko",
      name: "Wanko",
      jsonPath: "https://unpkg.com/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json"
    }
  ];

  let currentIndex = 0;

  const pickRandomIndex = function () {
    return Math.floor(Math.random() * models.length);
  };

  const removeExistingWidget = function () {
    const widget = document.getElementById("live2d-widget");
    if (widget) widget.remove();
  };

  const renderWidget = function () {
    if (window.innerWidth <= 900) return;
    if (typeof window.L2Dwidget === "undefined") return;

    removeExistingWidget();

    window.setTimeout(function () {
      window.L2Dwidget.init({
        model: {
          jsonPath: models[currentIndex].jsonPath,
          scale: 1
        },
        display: {
          position: "right",
          width: 170,
          height: 340,
          hOffset: 0,
          vOffset: -18
        },
        mobile: {
          show: false,
          scale: 0.6
        },
        react: {
          opacityDefault: 0.92,
          opacityOnHover: 1
        }
      });
    }, 80);
  };

  const initLive2D = function () {
    if (window.innerWidth <= 900) return;
    if (typeof window.L2Dwidget === "undefined") return;
    if (window.__cyLive2DInitialized) return;

    window.__cyLive2DInitialized = true;
    currentIndex = pickRandomIndex();
    renderWidget();
  };

  if (document.readyState === "complete") {
    initLive2D();
  } else {
    window.addEventListener("load", initLive2D, { once: true });
  }
})();
