(function () {
  const stateKey = "__cyHomeBgEffects";

  if (window[stateKey]) {
    window[stateKey].refresh();
    return;
  }

  const state = {
    universeCanvas: null,
    snowCanvas: null,
    universeContext: null,
    snowContext: null,
    width: 0,
    height: 0,
    particles: [],
    flakes: [],
    pointerX: -100,
    pointerY: -100,
    running: false,
    universeFrameId: 0,
    snowFrameId: 0
  };

  const config = {
    universeColor: "180,184,240",
    starColor: "226,225,142",
    cometColor: "226,225,224",
    speedBase: 0.05,
    snowflakeCount: 50,
    snowMinDist: 150,
    snowColor: "255, 255, 255",
    snowSize: 1.5,
    snowSpeed: 0.5,
    snowOpacity: 0.7,
    snowStepSize: 0.5
  };

  const clamp = function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  const random = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  const chance = function (ratio) {
    return Math.floor(Math.random() * 1000) + 1 < ratio * 10;
  };

  const prefersReducedMotion = function () {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const currentTheme = function () {
    return document.documentElement.getAttribute("data-theme") || "dark";
  };

  const ensureCanvas = function (id) {
    let canvas = document.getElementById(id);

    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = id;
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }

    return canvas;
  };

  const resize = function () {
    state.width = window.innerWidth;
    state.height = window.innerHeight;

    if (state.universeCanvas) {
      state.universeCanvas.width = state.width;
      state.universeCanvas.height = state.height;
    }

    if (state.snowCanvas) {
      state.snowCanvas.width = state.width;
      state.snowCanvas.height = state.height;
    }
  };

  const resetParticle = function (particle) {
    particle.giant = chance(3);
    particle.comet = !particle.giant && !particle.booting && chance(10);
    particle.x = random(0, state.width - 10);
    particle.y = random(0, state.height);
    particle.r = random(1.1, 2.6);
    particle.dx = random(config.speedBase, 6 * config.speedBase)
      + (particle.comet ? config.speedBase * random(50, 120) : 0)
      + 2 * config.speedBase;
    particle.dy = -random(config.speedBase, 6 * config.speedBase)
      - (particle.comet ? config.speedBase * random(50, 120) : 0);
    particle.fadingOut = false;
    particle.fadingIn = true;
    particle.opacity = 0;
    particle.opacityThreshold = random(0.2, particle.comet ? 0.6 : 1);
    particle.fadeStep = random(0.0005, 0.002) + (particle.comet ? 0.001 : 0);
  };

  const syncParticles = function () {
    const targetCount = Math.max(80, Math.round(0.216 * state.width));

    while (state.particles.length < targetCount) {
      const particle = { booting: true };
      resetParticle(particle);
      state.particles.push(particle);
    }

    if (state.particles.length > targetCount) {
      state.particles.length = targetCount;
    }

    window.setTimeout(function () {
      for (let index = 0; index < state.particles.length; index += 1) {
        state.particles[index].booting = false;
      }
    }, 50);
  };

  const drawUniverse = function () {
    if (!state.universeContext) return;

    const ctx = state.universeContext;
    ctx.clearRect(0, 0, state.width, state.height);

    for (let index = 0; index < state.particles.length; index += 1) {
      const particle = state.particles[index];

      particle.x += particle.dx;
      particle.y += particle.dy;

      if (particle.x > state.width - state.width / 4 || particle.y < 0) {
        particle.fadingOut = true;
      }

      if (particle.fadingIn) {
        particle.fadingIn = particle.opacity <= particle.opacityThreshold;
        particle.opacity += particle.fadeStep;
      }

      if (particle.fadingOut) {
        particle.fadingOut = particle.opacity >= 0;
        particle.opacity -= particle.fadeStep / 2;

        if (particle.x > state.width || particle.y < 0) {
          resetParticle(particle);
        }
      }

      ctx.beginPath();

      if (particle.giant) {
        ctx.fillStyle = "rgba(" + config.universeColor + "," + particle.opacity + ")";
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2, false);
      } else if (particle.comet) {
        ctx.fillStyle = "rgba(" + config.cometColor + "," + particle.opacity + ")";
        ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2, false);

        for (let tail = 0; tail < 30; tail += 1) {
          ctx.fillStyle = "rgba(" + config.cometColor + "," + (particle.opacity - particle.opacity / 20 * tail) + ")";
          ctx.rect(particle.x - particle.dx / 4 * tail, particle.y - particle.dy / 4 * tail - 2, 2, 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "rgba(" + config.starColor + "," + particle.opacity + ")";
        ctx.rect(particle.x, particle.y, particle.r, particle.r);
      }

      ctx.closePath();
      ctx.fill();
    }
  };

  const resetFlake = function (flake, randomY) {
    flake.x = Math.floor(Math.random() * state.width);
    flake.y = randomY ? Math.floor(Math.random() * state.height) : 0;
    flake.size = 3 * Math.random() + 2;
    flake.speed = Math.random() + 0.5;
    flake.velY = flake.speed;
    flake.velX = 0;
    flake.opacity = 0.5 * Math.random() + 0.3;
    flake.stepSize = Math.random() / 30 * config.snowStepSize;
    flake.step = 0;
  };

  const syncFlakes = function () {
    while (state.flakes.length < config.snowflakeCount) {
      const flake = {};
      resetFlake(flake, true);
      state.flakes.push(flake);
    }

    if (state.flakes.length > config.snowflakeCount) {
      state.flakes.length = config.snowflakeCount;
    }
  };

  const drawSnow = function () {
    if (!state.snowContext) return;

    const ctx = state.snowContext;
    ctx.clearRect(0, 0, state.width, state.height);

    for (let index = 0; index < state.flakes.length; index += 1) {
      const flake = state.flakes[index];
      const distanceX = state.pointerX - flake.x;
      const distanceY = state.pointerY - flake.y;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < config.snowMinDist) {
        const force = config.snowMinDist / (distance * distance) / 2;
        flake.velX -= force * (distanceX / distance);
        flake.velY -= force * (distanceY / distance);
      } else {
        flake.velX *= 0.98;

        if (flake.velY < flake.speed && flake.speed - flake.velY > 0.01) {
          flake.velY += 0.01 * (flake.speed - flake.velY);
        }

        flake.velX += Math.cos((flake.step += 0.05)) * flake.stepSize;
      }

      flake.y += flake.velY;
      flake.x += flake.velX;

      if (flake.y >= state.height || flake.y <= 0 || flake.x >= state.width || flake.x <= 0) {
        resetFlake(flake, false);
      }

      ctx.beginPath();
      ctx.fillStyle = "rgba(" + config.snowColor + "," + flake.opacity + ")";
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const render = function () {
    if (!state.running) return;

    const darkMode = currentTheme() === "dark";
    state.universeCanvas.style.display = darkMode ? "block" : "none";
    state.snowCanvas.style.display = darkMode ? "none" : "block";

    if (darkMode) {
      drawUniverse();
      state.universeFrameId = window.requestAnimationFrame(render);
      return;
    }

    drawSnow();
    state.snowFrameId = window.requestAnimationFrame(render);
  };

  const bindPointer = function () {
    document.addEventListener("mousemove", function (event) {
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
    });
  };

  state.refresh = function () {
    if (prefersReducedMotion()) {
      if (state.universeCanvas) state.universeCanvas.style.display = "none";
      if (state.snowCanvas) state.snowCanvas.style.display = "none";
      state.running = false;
      return;
    }

    state.universeCanvas = ensureCanvas("universe");
    state.snowCanvas = ensureCanvas("snow");
    state.universeContext = state.universeCanvas.getContext("2d");
    state.snowContext = state.snowCanvas.getContext("2d");

    resize();
    syncParticles();
    syncFlakes();

    if (!state.running) {
      state.running = true;
      render();
    }
  };

  window.addEventListener("resize", function () {
    resize();
    syncParticles();
  });

  bindPointer();
  window[stateKey] = state;

  document.addEventListener("DOMContentLoaded", state.refresh);
  window.addEventListener("load", state.refresh);
  document.addEventListener("pjax:complete", state.refresh);

  state.refresh();
})();
