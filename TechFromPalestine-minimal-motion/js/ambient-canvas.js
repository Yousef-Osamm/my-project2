(() => {
  'use strict';

  const COLORS = Object.freeze({
    ground: '#0A0E1A',
    cyan: '#00F3FF',
    violet: '#43356F',
    blue: '#2563EB'
  });

  const MAX_DPR = 1.5;
  const POINTER_RADIUS = 180;
  const POINTER_SHIFT = 3;
  const MOBILE_BREAKPOINT = 560;
  const TECHNOLOGY_MARKS = Object.freeze([
    'HTML5/>',
    'CSS3{}',
    'JavaScript[]',
    'Python[]',
    'AI',
    'React()',
    'Node.js()',
    '{}',
    '<>',
    '//',
    '[]'
  ]);

  const EXCLUSION_SELECTORS = Object.freeze([
    '.hero-copy',
    '.page-hero__grid',
    '.section-heading',
    '.course-card',
    '.project-card__body',
    '.contact-form-wrap',
    '.filter-bar',
    '.stats-cluster',
    '.site-header',
    '.collection-toolbar'
  ]);

  const ROUTE_PRESETS = Object.freeze({
    home: { nodes: 36, fragments: 4, pockets: 2, links: 2, distance: 168, traces: 2, emphasis: 1 },
    about: { nodes: 30, fragments: 3, pockets: 1, links: 2, distance: 158, traces: 3, emphasis: 0.86 },
    courses: { nodes: 28, fragments: 2, pockets: 1, links: 2, distance: 150, traces: 2, emphasis: 0.72 },
    projects: { nodes: 34, fragments: 3, pockets: 2, links: 2, distance: 170, traces: 2, emphasis: 0.78 },
    community: { nodes: 38, fragments: 4, pockets: 2, links: 2, distance: 172, traces: 2, emphasis: 0.96 },
    contact: { nodes: 24, fragments: 1, pockets: 1, links: 1, distance: 142, traces: 2, emphasis: 0.58 }
  });

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const hashString = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const createSeededRandom = (seed) => {
    let state = seed || 1;
    return () => {
      state += 0x6D2B79F5;
      let result = state;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  };

  const rgba = (hex, alpha) => {
    const value = hex.replace('#', '');
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
  };

  class AmbientExclusionMap {
    constructor(selectors, padding = 24) {
      this.selectors = selectors;
      this.padding = padding;
      this.rectangles = [];
    }

    refresh() {
      this.rectangles = this.selectors.flatMap((selector) => (
        Array.from(document.querySelectorAll(selector)).map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left - this.padding,
            top: rect.top - this.padding,
            right: rect.right + this.padding,
            bottom: rect.bottom + this.padding
          };
        })
      ));
    }

    contains(x, y) {
      return this.rectangles.some((rect) => (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      ));
    }

    segmentIntersects(x1, y1, x2, y2) {
      return this.rectangles.some((rect) => {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        if (maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom) {
          return false;
        }

        for (let step = 0; step <= 8; step += 1) {
          const progress = step / 8;
          const x = x1 + (x2 - x1) * progress;
          const y = y1 + (y2 - y1) * progress;
          if (this.contains(x, y)) return true;
        }
        return false;
      });
    }
  }

  class NestedHexTrace {
    static drawHex(context, size) {
      const drawPolygon = (radius, sides = 6) => {
        context.beginPath();
        for (let index = 0; index <= sides; index += 1) {
          const angle = (Math.PI / 3) * index - Math.PI / 6;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      };

      drawPolygon(size, 6);
      drawPolygon(size * 0.62, 6);
      context.beginPath();
      context.moveTo(-size * 0.42, -size * 0.24);
      context.lineTo(0, -size * 0.48);
      context.lineTo(size * 0.42, -size * 0.24);
      context.moveTo(-size * 0.42, size * 0.24);
      context.lineTo(0, size * 0.48);
      context.lineTo(size * 0.42, size * 0.24);
      context.stroke();
    }

    static drawDiamond(context, size) {
      const drawSquare = (radius) => {
        context.beginPath();
        context.rect(-radius, -radius, radius * 2, radius * 2);
        context.stroke();
      };

      drawSquare(size);
      drawSquare(size * 0.58);
      context.beginPath();
      context.moveTo(-size * 0.82, 0);
      context.lineTo(size * 0.82, 0);
      context.moveTo(0, -size * 0.82);
      context.lineTo(0, size * 0.82);
      context.stroke();
    }
  }

  class AmbientCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = null;
      this.pageKey = document.body?.dataset.page || 'home';
      this.preset = ROUTE_PRESETS[this.pageKey] || ROUTE_PRESETS.home;
      this.random = createSeededRandom(hashString(`tfp-ambient-${this.pageKey}`));
      this.exclusions = new AmbientExclusionMap(EXCLUSION_SELECTORS);
      this.nodes = [];
      this.connections = [];
      this.fragments = [];
      this.pockets = [];
      this.traces = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.isMobile = false;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.visible = document.visibilityState === 'visible';
      this.pointer = { x: 0, y: 0, active: false };
      this.quality = 3;
      this.rafId = 0;
      this.lastTime = 0;
      this.slowFrameCount = 0;
      this.resizeTimer = 0;
      this.hasComposition = false;
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    }

    init() {
      try {
        this.context = this.canvas.getContext('2d', { alpha: true, desynchronized: true })
          || this.canvas.getContext('2d');
      } catch (error) {
        this.context = null;
      }

      if (!this.context) return;

      this.handleResize();
      this.draw();
      this.bindEvents();

      if (!this.reducedMotion && this.visible) {
        this.start();
      }
    }

    bindEvents() {
      window.addEventListener('resize', this.scheduleResize, { passive: true });
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.mediaQuery.addEventListener?.('change', this.handleMotionPreferenceChange);
    }

    handleResize = () => {
      const previousWidth = this.width;
      const previousHeight = this.height;
      this.width = Math.max(1, window.innerWidth);
      this.height = Math.max(1, window.innerHeight);
      this.isMobile = this.width <= MOBILE_BREAKPOINT;
      this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
      this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.exclusions.refresh();

      if (!this.hasComposition || !previousWidth || !previousHeight) {
        this.createComposition();
      } else {
        this.rebuildConnections();
        this.updateVisibility();
      }

      this.draw();
    };

    scheduleResize = () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(this.handleResize, 100);
    };

    handlePointerMove = (event) => {
      if (this.isMobile || this.reducedMotion) return;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    };

    handlePointerLeave = () => {
      this.pointer.active = false;
    };

    handleVisibilityChange = () => {
      this.visible = document.visibilityState === 'visible';
      if (!this.visible) {
        this.stop();
        return;
      }

      this.draw();
      if (!this.reducedMotion) this.start();
    };

    handleMotionPreferenceChange = (event) => {
      this.reducedMotion = event.matches;
      this.stop();
      this.draw();
      if (!this.reducedMotion && this.visible) this.start();
    };

    createComposition() {
      const nodeCount = this.isMobile
        ? clamp(Math.round(this.preset.nodes * 0.42), 12, 16)
        : this.preset.nodes;
      const fragmentCount = this.isMobile ? Math.min(2, this.preset.fragments) : this.preset.fragments;
      const pocketCount = this.isMobile ? Math.min(1, this.preset.pockets) : this.preset.pockets;
      const traceCount = this.isMobile ? 1 : this.preset.traces;

      this.nodes = Array.from({ length: nodeCount }, (_, index) => {
        const depth = 0.18 + this.random() * 0.82;
        const angle = this.random() * Math.PI * 2;
        const speed = 2.4 + this.random() * 4.8;
        return {
          id: index,
          nx: 0.04 + this.random() * 0.92,
          ny: 0.06 + this.random() * 0.88,
          z: depth,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          group: Math.floor(this.random() * 3),
          radius: 0.8 + depth * 1.35
        };
      });

      this.pockets = Array.from({ length: pocketCount }, () => ({
        nx: this.random() < 0.5 ? 0.06 + this.random() * 0.2 : 0.74 + this.random() * 0.2,
        ny: 0.16 + this.random() * 0.68,
        radius: 170 + this.random() * 120,
        alpha: 0.08 + this.random() * 0.04
      }));

      this.fragments = Array.from({ length: fragmentCount }, (_, index) => {
        const value = TECHNOLOGY_MARKS[(Math.floor(this.random() * TECHNOLOGY_MARKS.length) + index) % TECHNOLOGY_MARKS.length];
        const fragment = {
          value,
          nx: this.random() < 0.5 ? 0.04 + this.random() * 0.14 : 0.82 + this.random() * 0.14,
          ny: 0.14 + this.random() * 0.72,
          z: 0.25 + this.random() * 0.5,
          rotation: (this.random() - 0.5) * 0.16,
          drift: (this.random() - 0.5) * 0.00003,
          hidden: false
        };
        return fragment;
      });

      const traceLayouts = [
        { type: 'hex', nx: -0.04, ny: 0.18, size: 124 },
        { type: 'diamond', nx: 1.03, ny: 0.72, size: 142 },
        { type: 'hex', nx: 0.86, ny: 1.04, size: 100 }
      ];
      this.traces = traceLayouts.slice(0, traceCount).map((layout, index) => ({
        ...layout,
        rotation: index % 2 === 0 ? -0.12 : 0.18,
        spin: index % 2 === 0 ? 0.00008 : -0.00006
      }));

      this.hasComposition = true;
      this.rebuildConnections();
      this.updateVisibility();
    }

    getProjectedNode(node) {
      const baseX = node.nx * this.width;
      const baseY = node.ny * this.height;
      let shiftX = 0;
      let shiftY = 0;
      let pointerInfluence = 0;

      if (this.pointer.active && !this.isMobile && !this.reducedMotion) {
        const distance = Math.hypot(this.pointer.x - baseX, this.pointer.y - baseY);
        pointerInfluence = clamp(1 - distance / POINTER_RADIUS, 0, 1);
        shiftX = ((this.pointer.x - this.width / 2) / this.width) * POINTER_SHIFT * pointerInfluence;
        shiftY = ((this.pointer.y - this.height / 2) / this.height) * POINTER_SHIFT * pointerInfluence;
      }

      return { x: baseX + shiftX, y: baseY + shiftY, pointerInfluence };
    }

    rebuildConnections() {
      const maxDistance = this.isMobile ? 92 : this.preset.distance;
      const maxLinks = this.isMobile ? 1 : this.preset.links;
      const pairs = new Map();

      this.nodes.forEach((node, index) => {
        const origin = this.getProjectedNode(node);
        const nearest = this.nodes
          .map((candidate, candidateIndex) => {
            if (candidateIndex === index) return null;
            const point = this.getProjectedNode(candidate);
            return {
              index: candidateIndex,
              distance: Math.hypot(point.x - origin.x, point.y - origin.y)
            };
          })
          .filter(Boolean)
          .sort((first, second) => first.distance - second.distance)
          .slice(0, maxLinks);

        nearest.forEach(({ index: targetIndex, distance }) => {
          if (distance > maxDistance) return;
          const first = Math.min(index, targetIndex);
          const second = Math.max(index, targetIndex);
          const key = `${first}:${second}`;
          if (!pairs.has(key)) {
            pairs.set(key, {
              source: first,
              target: second,
              strength: 1 - distance / maxDistance
            });
          }
        });
      });

      this.connections = Array.from(pairs.values());
    }

    updateVisibility() {
      this.fragments.forEach((fragment) => {
        fragment.hidden = this.exclusions.contains(fragment.nx * this.width, fragment.ny * this.height);
      });
    }

    update(delta) {
      if (this.reducedMotion) return;
      const seconds = clamp(delta, 0, 32) / 1000;

      this.nodes.forEach((node) => {
        node.nx += (node.vx * seconds) / this.width;
        node.ny += (node.vy * seconds) / this.height;
        if (node.nx < 0.025 || node.nx > 0.975) node.vx *= -1;
        if (node.ny < 0.035 || node.ny > 0.965) node.vy *= -1;
        node.nx = clamp(node.nx, 0.025, 0.975);
        node.ny = clamp(node.ny, 0.035, 0.965);
      });

      this.fragments.forEach((fragment) => {
        fragment.ny += fragment.drift * delta;
        if (fragment.ny < 0.1 || fragment.ny > 0.9) fragment.drift *= -1;
      });

      this.traces.forEach((trace) => {
        trace.rotation += trace.spin * delta;
      });

      this.rebuildConnections();
    }

    draw() {
      if (!this.context || !this.width || !this.height) return;
      const context = this.context;
      context.clearRect(0, 0, this.width, this.height);
      context.fillStyle = COLORS.ground;
      context.fillRect(0, 0, this.width, this.height);

      this.drawPockets();
      this.drawConnections();
      this.drawNodes();
      this.drawFragments();
      this.drawTraces();
    }

    drawPockets() {
      if (this.quality < 2) return;
      const context = this.context;
      context.save();
      context.globalCompositeOperation = 'screen';
      this.pockets.forEach((pocket) => {
        const x = pocket.nx * this.width;
        const y = pocket.ny * this.height;
        const radius = pocket.radius * (this.isMobile ? 0.72 : 1);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, rgba(COLORS.violet, pocket.alpha * this.preset.emphasis));
        gradient.addColorStop(0.55, rgba(COLORS.violet, pocket.alpha * 0.32));
        gradient.addColorStop(1, rgba(COLORS.violet, 0));
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });
      context.restore();
    }

    drawConnections() {
      const context = this.context;
      const nodeLimit = this.quality <= 1 ? Math.ceil(this.nodes.length * 0.78) : this.nodes.length;
      context.save();
      context.lineWidth = 0.7;
      this.connections.forEach((connection) => {
        if (connection.source >= nodeLimit || connection.target >= nodeLimit) return;
        const source = this.getProjectedNode(this.nodes[connection.source]);
        const target = this.getProjectedNode(this.nodes[connection.target]);
        if (this.exclusions.segmentIntersects(source.x, source.y, target.x, target.y)) return;
        const depth = (this.nodes[connection.source].z + this.nodes[connection.target].z) / 2;
        const pointerBoost = (source.pointerInfluence + target.pointerInfluence) * 0.07;
        const alpha = (0.08 + connection.strength * 0.14 + depth * 0.06 + pointerBoost)
          * this.preset.emphasis;
        context.strokeStyle = rgba(COLORS.cyan, alpha);
        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.stroke();
      });
      context.restore();
    }

    drawNodes() {
      const context = this.context;
      const nodeLimit = this.quality <= 1 ? Math.ceil(this.nodes.length * 0.78) : this.nodes.length;
      context.save();
      this.nodes.slice(0, nodeLimit).forEach((node) => {
        const point = this.getProjectedNode(node);
        const quiet = this.exclusions.contains(point.x, point.y);
        const baseAlpha = (0.14 + node.z * 0.34 + point.pointerInfluence * 0.14) * this.preset.emphasis;
        const alpha = quiet ? baseAlpha * 0.12 : baseAlpha;
        const radius = node.radius + point.pointerInfluence * 0.5;
        context.fillStyle = rgba(COLORS.cyan, alpha);
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();

        if (!quiet && (node.z > 0.72 || point.pointerInfluence > 0.1)) {
          context.strokeStyle = rgba(COLORS.cyan, alpha * 0.42);
          context.lineWidth = 0.6;
          context.beginPath();
          context.arc(point.x, point.y, radius + 3 + point.pointerInfluence * 2, 0, Math.PI * 2);
          context.stroke();
        }
      });
      context.restore();
    }

    drawFragments() {
      if (this.quality < 3) return;
      const context = this.context;
      context.save();
      context.direction = 'ltr';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '600 9px "Plus Jakarta Sans", sans-serif';
      this.fragments.forEach((fragment) => {
        const x = fragment.nx * this.width;
        const y = fragment.ny * this.height;
        if (fragment.hidden || this.exclusions.contains(x, y)) return;
        const alpha = (0.08 + fragment.z * 0.08) * this.preset.emphasis;
        context.save();
        context.translate(x, y);
        context.rotate(fragment.rotation);
        context.fillStyle = rgba(COLORS.cyan, alpha);
        context.fillText(fragment.value, 0, 0);
        context.restore();
      });
      context.restore();
    }

    drawTraces() {
      const context = this.context;
      context.save();
      context.lineWidth = 0.75;
      context.strokeStyle = rgba(COLORS.cyan, this.isMobile ? 0.075 : 0.11);
      this.traces.forEach((trace) => {
        const x = trace.nx * this.width;
        const y = trace.ny * this.height;
        context.save();
        context.translate(x, y);
        context.rotate(trace.rotation);
        if (trace.type === 'hex') NestedHexTrace.drawHex(context, trace.size);
        else NestedHexTrace.drawDiamond(context, trace.size);
        context.restore();
      });
      context.restore();
    }

    start() {
      if (this.rafId || this.reducedMotion || !this.visible) return;
      this.lastTime = performance.now();
      this.rafId = window.requestAnimationFrame(this.frame);
    }

    stop() {
      if (!this.rafId) return;
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.lastTime = 0;
    }

    frame = (time) => {
      if (!this.visible || this.reducedMotion) {
        this.rafId = 0;
        return;
      }

      const delta = Math.min(time - this.lastTime, 32);
      this.lastTime = time;
      this.update(delta);
      this.draw();
      this.trackPerformance(delta);
      this.rafId = window.requestAnimationFrame(this.frame);
    };

    trackPerformance(delta) {
      if (delta > 26) this.slowFrameCount += 1;
      else this.slowFrameCount = Math.max(0, this.slowFrameCount - 1);

      if (this.slowFrameCount < 45) return;
      this.slowFrameCount = 0;
      this.quality -= 1;
      if (this.quality <= 0) {
        this.quality = 0;
        this.stop();
        this.draw();
      }
    }
  }

  const initAmbientCanvas = () => {
    const canvas = document.querySelector('#ambient-field');
    if (!canvas) return;
    const ambientCanvas = new AmbientCanvas(canvas);
    ambientCanvas.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmbientCanvas, { once: true });
  } else {
    initAmbientCanvas();
  }
})();
