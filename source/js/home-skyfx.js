(function () {
  const HOME_HEADER_SELECTOR = "#page-header.full_page";
  const SKY_LAYER_SELECTOR = ".cy-skyfx";
  const MAX_DPR = 2;
  const AREA_PER_PARTICLE = 18000;
  const MIN_PARTICLES = 42;
  const MAX_PARTICLES = 96;
  const ATTRACT_RADIUS = 168;
  const ABSORB_RADIUS = 18;
  const ATTRACT_FORCE = 0.085;
  const JITTER_FORCE = 0.0022;
  const FRICTION = 0.995;
  const MAX_SPEED = 1.18;

  let activeInstance = null;
  let bootstrapped = false;

  const clamp = function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  const randomBetween = function (min, max) {
    return min + Math.random() * (max - min);
  };

  const buildVelocity = function (speed) {
    const angle = Math.random() * Math.PI * 2;

    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  };

  const createParticle = function (width, height) {
    const speed = randomBetween(0.16, 0.48);
    const velocity = buildVelocity(speed);

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: velocity.vx,
      vy: velocity.vy,
      radius: randomBetween(1.1, 2.8),
      alpha: randomBetween(0.66, 1),
      twinkle: randomBetween(0, Math.PI * 2),
      tint: Math.random() > 0.78 ? "warm" : "cool",
      glow: 0
    };
  };

  const respawnParticle = function (particle, width, height) {
    const edge = Math.floor(Math.random() * 4);
    const speed = randomBetween(0.18, 0.52);
    const velocity = buildVelocity(speed);

    if (edge === 0) {
      particle.x = randomBetween(0, width);
      particle.y = -particle.radius * 2;
    } else if (edge === 1) {
      particle.x = width + particle.radius * 2;
      particle.y = randomBetween(0, height);
    } else if (edge === 2) {
      particle.x = randomBetween(0, width);
      particle.y = height + particle.radius * 2;
    } else {
      particle.x = -particle.radius * 2;
      particle.y = randomBetween(0, height);
    }

    particle.vx = velocity.vx;
    particle.vy = velocity.vy;
    particle.alpha = randomBetween(0.66, 1);
    particle.radius = randomBetween(1.1, 2.8);
    particle.twinkle = randomBetween(0, Math.PI * 2);
    particle.tint = Math.random() > 0.78 ? "warm" : "cool";
    particle.glow = 0;
  };

  const initializeHomeSky = function () {
    const header = document.querySelector(HOME_HEADER_SELECTOR);
    const skyLayer = header ? header.querySelector(SKY_LAYER_SELECTOR) : null;

    if (!header || !skyLayer) return;

    if (activeInstance) {
      activeInstance.destroy();
    }

    const canvas = skyLayer.querySelector(".cy-skyfx__particle-canvas") || document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.className = "cy-skyfx__particle-canvas";
    if (!canvas.parentNode) {
      skyLayer.appendChild(canvas);
    }

    const particles = [];
    const pointer = {
      x: 0,
      y: 0,
      active: false,
      flash: 0
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = 0;
    let lastFrameTime = performance.now();
    let resizeObserver = null;

    const updateCanvasSize = function () {
      const rect = skyLayer.getBoundingClientRect();

      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = clamp(Math.round((width * height) / AREA_PER_PARTICLE), MIN_PARTICLES, MAX_PARTICLES);

      while (particles.length < targetCount) {
        particles.push(createParticle(width, height));
      }

      if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    };

    const ensureInitialized = function () {
      updateCanvasSize();

      if (width < 24 || height < 24) {
        window.setTimeout(ensureInitialized, 120);
        return;
      }

      lastFrameTime = performance.now();
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = function (event) {
      const rect = skyLayer.getBoundingClientRect();

      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      pointer.flash = Math.min(1, pointer.flash + 0.18);
    };

    const handlePointerLeave = function () {
      pointer.active = false;
    };

    const drawPointerAura = function () {
      if (!pointer.active && pointer.flash <= 0.01) return;

      pointer.flash *= 0.92;

      const radius = ATTRACT_RADIUS * (0.34 + pointer.flash * 0.16);
      const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);

      gradient.addColorStop(0, "rgba(255, 248, 228, 0.26)");
      gradient.addColorStop(0.16, "rgba(173, 229, 255, 0.18)");
      gradient.addColorStop(0.46, "rgba(114, 208, 255, 0.08)");
      gradient.addColorStop(1, "rgba(114, 208, 255, 0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const animate = function (timestamp) {
      animationFrameId = window.requestAnimationFrame(animate);

      const delta = clamp((timestamp - lastFrameTime) / 16.6667, 0.65, 1.8);
      lastFrameTime = timestamp;

      context.clearRect(0, 0, width, height);
      drawPointerAura();

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];

        particle.vx += (Math.random() - 0.5) * JITTER_FORCE * delta;
        particle.vy += (Math.random() - 0.5) * JITTER_FORCE * delta;

        if (pointer.active) {
          const dx = pointer.x - particle.x;
          const dy = pointer.y - particle.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < ATTRACT_RADIUS * ATTRACT_RADIUS) {
            const distance = Math.max(Math.sqrt(distanceSq), 1);
            const pull = 1 - distance / ATTRACT_RADIUS;

            if (distance <= ABSORB_RADIUS) {
              pointer.flash = 1;
              respawnParticle(particle, width, height);
              continue;
            }

            const force = pull * pull * ATTRACT_FORCE * delta;

            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
            particle.glow = Math.min(1, particle.glow + pull * 0.26);
          } else {
            particle.glow *= 0.92;
          }
        } else {
          particle.glow *= 0.92;
        }

        particle.vx *= FRICTION;
        particle.vy *= FRICTION;

        const speed = Math.hypot(particle.vx, particle.vy);

        if (speed > MAX_SPEED) {
          const ratio = MAX_SPEED / speed;
          particle.vx *= ratio;
          particle.vy *= ratio;
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;

        if (particle.x <= particle.radius) {
          particle.x = particle.radius;
          particle.vx = Math.abs(particle.vx);
        } else if (particle.x >= width - particle.radius) {
          particle.x = width - particle.radius;
          particle.vx = -Math.abs(particle.vx);
        }

        if (particle.y <= particle.radius) {
          particle.y = particle.radius;
          particle.vy = Math.abs(particle.vy);
        } else if (particle.y >= height - particle.radius) {
          particle.y = height - particle.radius;
          particle.vy = -Math.abs(particle.vy);
        }

        particle.twinkle += randomBetween(0.015, 0.035) * delta;

        const directionLength = Math.max(Math.hypot(particle.vx, particle.vy), 0.001);
        const directionX = particle.vx / directionLength;
        const directionY = particle.vy / directionLength;
        const tailLength = 10 + directionLength * 40 + particle.glow * 18;
        const tailStartX = particle.x - directionX * tailLength;
        const tailStartY = particle.y - directionY * tailLength;
        const particleAlpha = clamp(
          particle.alpha * (0.72 + Math.sin(particle.twinkle) * 0.18 + particle.glow * 0.42),
          0.16,
          1
        );
        const tailGradient = context.createLinearGradient(tailStartX, tailStartY, particle.x, particle.y);

        if (particle.tint === "warm") {
          tailGradient.addColorStop(0, "rgba(255, 238, 196, 0)");
          tailGradient.addColorStop(0.55, "rgba(194, 228, 255, 0.12)");
          tailGradient.addColorStop(1, "rgba(255, 245, 222, " + particleAlpha + ")");
        } else {
          tailGradient.addColorStop(0, "rgba(148, 214, 255, 0)");
          tailGradient.addColorStop(0.55, "rgba(168, 227, 255, 0.14)");
          tailGradient.addColorStop(1, "rgba(220, 244, 255, " + particleAlpha + ")");
        }

        context.lineCap = "round";
        context.lineWidth = particle.radius * (1.05 + particle.glow * 0.8);
        context.strokeStyle = tailGradient;
        context.beginPath();
        context.moveTo(tailStartX, tailStartY);
        context.lineTo(particle.x, particle.y);
        context.stroke();

        context.fillStyle =
          particle.tint === "warm"
            ? "rgba(255, 246, 228, " + particleAlpha + ")"
            : "rgba(218, 241, 255, " + particleAlpha + ")";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius + particle.glow * 0.9, 0, Math.PI * 2);
        context.fill();
      }
    };

    const destroy = function () {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("load", ensureInitialized);
      header.removeEventListener("pointermove", handlePointerMove);
      header.removeEventListener("pointerleave", handlePointerLeave);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };

    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("load", ensureInitialized, { once: true });
    header.addEventListener("pointermove", handlePointerMove, { passive: true });
    header.addEventListener("pointerleave", handlePointerLeave, { passive: true });

      if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(skyLayer);
      }

      context.globalCompositeOperation = "screen";
      ensureInitialized();
      activeInstance = { destroy: destroy };
  };

  const bootstrap = function () {
    if (bootstrapped) return;
    bootstrapped = true;
    initializeHomeSky();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }

  window.addEventListener("load", bootstrap, { once: true });
})();
