import { useEffect } from 'react';

const CSS_DRIVEN_HERO_ANIMATION_SELECTOR = [
  '.hero-anim-none',
  '.hero-anim-loans-unblur',
  '.hero-anim-loans-slide',
  '.hero-anim-loans-slide-followup',
].join(', ');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseNumericAttribute(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number.parseFloat(String(value).trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseCountText(text) {
  const trimmed = (text || '').trim();
  const match = trimmed.match(/-?[\d,.]+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const numericText = match[0].replace(/,/g, '');
  const value = Number.parseFloat(numericText);
  if (Number.isNaN(value)) {
    return null;
  }

  const decimals = (numericText.split('.')[1] || '').length;
  const prefix = trimmed.slice(0, match.index || 0);
  const suffix = trimmed.slice((match.index || 0) + match[0].length);
  return { value, decimals, prefix, suffix };
}

function formatCountValue(value, decimals) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

export default function useNativeEnhancements(containerRef, rerunKey) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    const cleanups = [];
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    const runHeroHeadingReveal = () => {
      if (root.classList.contains('loans-native-page')) {
        return;
      }

      const heroKey = String(rerunKey || root.className || 'native-hero');
      if (root.dataset.heroRevealKey === heroKey) {
        return;
      }
      root.dataset.heroRevealKey = heroKey;

      const heroRoot = root.querySelector('.service-native-hero') || root;
      const cssDrivenHeroLines = Array.from(heroRoot.querySelectorAll(CSS_DRIVEN_HERO_ANIMATION_SELECTOR))
        .filter((node, index, arr) => arr.indexOf(node) === index);

      if (cssDrivenHeroLines.length) {
        return;
      }

      const lineNodes = Array.from(heroRoot.querySelectorAll('.line1, .line2'))
        .filter((node, index, arr) => arr.indexOf(node) === index);

      if (lineNodes.length) {
        const animateSlideIn = (node, delayMs) => {
          if (!node) {
            return;
          }
          node.style.transition = 'none';
          node.style.opacity = '0';
          node.style.transform = 'translateX(200px)';
          node.getBoundingClientRect();
          node.style.transition = 'opacity 1000ms ease, transform 1000ms ease';

          if (prefersReducedMotion) {
            node.style.opacity = '1';
            node.style.transform = 'translateX(0)';
            return;
          }

          const start = () => {
            requestAnimationFrame(() => {
              node.style.opacity = '1';
              node.style.transform = 'translateX(0)';
            });
          };

          const timer = window.setTimeout(() => {
            start();
          }, delayMs);
          cleanups.push(() => {
            window.clearTimeout(timer);
            node.style.opacity = '1';
            node.style.transform = 'translateX(0)';
          });
        };

        lineNodes.forEach((node, index) => {
          animateSlideIn(node, index * 300);
        });
        return;
      }

      const lineBlur = heroRoot.querySelector('.lineblur');
      const lineB = heroRoot.querySelector('.lineB');

      if (!lineBlur && !lineB) {
        return;
      }

      if (prefersReducedMotion) {
        if (lineBlur) {
          lineBlur.style.opacity = '1';
          lineBlur.style.filter = 'blur(0px)';
        }
        if (lineB) {
          lineB.style.transition = 'none';
          lineB.style.opacity = '1';
          lineB.style.transform = 'translateX(0)';
        }
        return;
      }

      if (lineBlur) {
        lineBlur.style.opacity = '0';
        lineBlur.style.filter = 'blur(22px)';
        lineBlur.style.transition = 'opacity 3000ms ease, filter 3000ms ease';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            lineBlur.style.opacity = '1';
            lineBlur.style.filter = 'blur(0px)';
          });
        });
      }

      if (!lineB) {
        return;
      }

      lineB.style.opacity = '1';
      lineB.style.transform = 'translateX(60px)';
      lineB.style.transition = 'transform 2000ms ease';

      const revealTimer = window.setTimeout(() => {
        lineB.style.transform = 'translateX(0)';
      }, 1300);
      const settleTimer = window.setTimeout(() => {
        lineB.style.opacity = '1';
        lineB.style.transform = 'translateX(0)';
      }, 3600);

      cleanups.push(() => {
        window.clearTimeout(revealTimer);
        window.clearTimeout(settleTimer);
        lineB.style.opacity = '1';
        lineB.style.transform = 'translateX(0)';
      });
    };

    const runFadeUp = () => {
      const nodes = Array.from(root.querySelectorAll('.fade-up'));
      if (!nodes.length) {
        return;
      }

      const clearPendingState = (target) => {
        if (!target) {
          return;
        }
        target.removeAttribute('data-fade-state');
        target.classList.add('is-visible');
      };

      if (prefersReducedMotion) {
        nodes.forEach((el) => clearPendingState(el));
        return;
      }

      if (!('IntersectionObserver' in window)) {
        nodes.forEach((el) => clearPendingState(el));
        return;
      }

      const timers = new Map();
      const queuedTargets = new WeakSet();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

      const isInitiallyVisible = (target) => {
        if (!target || !viewportHeight) {
          return false;
        }
        if (target.classList.contains('fade-up-force-observe')) {
          return false;
        }
        const rect = target.getBoundingClientRect();
        const triggerBottom = viewportHeight + Math.min(160, viewportHeight * 0.18);
        return rect.bottom > 0 && rect.top < triggerBottom;
      };

      const queueReveal = (target, index) => {
        if (!target || queuedTargets.has(target)) {
          return;
        }

        queuedTargets.add(target);
        const delayMs = 90 + ((index % 8) * 90);
        const timer = window.setTimeout(() => {
          requestAnimationFrame(() => {
            clearPendingState(target);
          });
          timers.delete(target);
        }, delayMs);

        timers.set(target, timer);
      };
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const index = Number(entry.target.getAttribute('data-fade-order'));
            if (!Number.isFinite(index)) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
              return;
            }

            queueReveal(entry.target, index);
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px' },
      );

      nodes.forEach((el, index) => {
        el.classList.remove('is-visible');
        el.setAttribute('data-fade-order', String(index));
        if (isInitiallyVisible(el)) {
          clearPendingState(el);
          return;
        }
        el.setAttribute('data-fade-state', 'pending');
        observer.observe(el);
      });
      cleanups.push(() => {
        observer.disconnect();
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
        nodes.forEach((el) => {
          el.removeAttribute('data-fade-state');
        });
      });
    };

    const runFadeOut = () => {
      const nodes = Array.from(root.querySelectorAll('.fade-out'));
      if (!nodes.length) {
        return;
      }

      const fadeConfigs = nodes.map((el) => ({
        el,
        startVh: parseNumericAttribute(el.getAttribute('data-fade-out-start-vh'), 0.12),
        endVh: parseNumericAttribute(el.getAttribute('data-fade-out-end-vh'), -0.24),
        maxReduction: parseNumericAttribute(el.getAttribute('data-fade-out-max-reduction'), 0.58),
        classThreshold: parseNumericAttribute(el.getAttribute('data-fade-out-class-threshold'), 0.04),
      }));

      if (prefersReducedMotion) {
        fadeConfigs.forEach(({ el }) => {
          el.style.setProperty('--scroll-opacity', '1');
          el.classList.remove('is-fading');
        });
        return;
      }

      let rafId = 0;

      const update = () => {
        rafId = 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;

        fadeConfigs.forEach((config) => {
          const {
            el,
            startVh,
            endVh,
            maxReduction,
            classThreshold,
          } = config;
          const startY = vh * startVh;
          const endY = vh * endVh;
          const rect = el.getBoundingClientRect();
          const progress = clamp((startY - rect.top) / (startY - endY), 0, 1);
          const opacity = 1 - (maxReduction * progress);
          el.style.setProperty('--scroll-opacity', opacity.toFixed(3));
          if (progress > classThreshold) {
            el.classList.add('is-fading');
          } else {
            el.classList.remove('is-fading');
          }
        });
      };

      const requestUpdate = () => {
        if (rafId) {
          return;
        }
        rafId = window.requestAnimationFrame(update);
      };

      update();
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
      cleanups.push(() => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', requestUpdate);
        window.removeEventListener('resize', requestUpdate);
        fadeConfigs.forEach(({ el }) => {
          el.style.removeProperty('--scroll-opacity');
          el.classList.remove('is-fading');
        });
      });
    };

    const runCountUp = () => {
      const targets = Array.from(root.querySelectorAll('.countup'));
      if (!targets.length) {
        return;
      }

      const rafIds = new Map();

      const setFinalValue = (el) => {
        if (el.dataset.countupDone === '1') {
          return false;
        }
        const parsed = parseCountText(el.textContent);
        if (!parsed) {
          return false;
        }

        const {
          value, decimals, prefix, suffix,
        } = parsed;
        el.dataset.countupDone = '1';
        el.textContent = `${prefix}${formatCountValue(value, decimals)}${suffix}`;
        return true;
      };

      const animate = (el) => {
        if (el.dataset.countupDone === '1') {
          return;
        }
        const parsed = parseCountText(el.textContent);
        if (!parsed) {
          return;
        }
        el.dataset.countupDone = '1';

        const {
          value, decimals, prefix, suffix,
        } = parsed;
        const durationMs = 1800;
        const start = performance.now();

        const step = (now) => {
          const t = clamp((now - start) / durationMs, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = value * eased;
          el.textContent = `${prefix}${formatCountValue(current, decimals)}${suffix}`;
          if (t < 1) {
            const rafId = requestAnimationFrame(step);
            rafIds.set(el, rafId);
          } else {
            el.textContent = `${prefix}${formatCountValue(value, decimals)}${suffix}`;
            rafIds.delete(el);
          }
        };
        const rafId = requestAnimationFrame(step);
        rafIds.set(el, rafId);
      };

      if (prefersReducedMotion) {
        targets.forEach((el) => {
          setFinalValue(el);
        });
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            animate(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.35 },
      );
      targets.forEach((el) => observer.observe(el));
      cleanups.push(() => {
        observer.disconnect();
        rafIds.forEach((rafId) => cancelAnimationFrame(rafId));
        rafIds.clear();
      });
    };

    const runCarouselStack = () => {
      const stacks = Array.from(root.querySelectorAll('.carousel-stack'));
      if (!stacks.length) {
        return;
      }
      const stackControllers = [];

      stacks.forEach((stack) => {
        const slides = Array.from(stack.querySelectorAll('.carousel-frame'));
        if (!slides.length) {
          return;
        }

        let current = 0;
        let timer = null;
        let disposed = false;

        const setStackHeight = () => {
          if (disposed) {
            return;
          }
          const maxHeight = slides.reduce((max, slide) => {
            const prevPos = slide.style.position;
            slide.style.position = 'static';
            const height = slide.offsetHeight;
            slide.style.position = prevPos || 'absolute';
            return Math.max(max, height);
          }, 0);
          if (maxHeight) {
            stack.style.height = `${maxHeight}px`;
          }
        };

        const scheduleNext = () => {
          if (disposed || prefersReducedMotion || slides.length < 2) {
            return;
          }
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            if (disposed) {
              return;
            }
            const next = (current + 1) % slides.length;
            slides[current]?.classList.remove('is-active');
            slides[next]?.classList.add('is-active');
            current = next;
            scheduleNext();
          }, 6000);
        };

        setStackHeight();
        document.fonts?.ready?.then(setStackHeight);
        slides.forEach((slide, index) => {
          slide.classList.toggle('is-active', index === 0);
        });
        scheduleNext();

        stackControllers.push({
          setStackHeight,
          dispose: () => {
            disposed = true;
            window.clearTimeout(timer);
          },
        });
      });

      if (!stackControllers.length) {
        return;
      }

      const onResize = () => {
        stackControllers.forEach((controller) => controller.setStackHeight());
      };
      window.addEventListener('resize', onResize);
      cleanups.push(() => {
        stackControllers.forEach((controller) => controller.dispose());
        window.removeEventListener('resize', onResize);
      });
    };

    runHeroHeadingReveal();
    runFadeUp();
    runFadeOut();
    runCountUp();
    runCarouselStack();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerRef, rerunKey]);
}
