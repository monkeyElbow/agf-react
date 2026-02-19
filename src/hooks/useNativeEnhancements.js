import { useEffect } from 'react';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

      const line1 = root.querySelector('.line1');
      const line2 = root.querySelector('.line2');

      if (line1 || line2) {
        const animateSlideIn = (node, delayMs) => {
          if (!node || node.dataset.animDone === '1') {
            return;
          }
          node.dataset.animDone = '1';
          node.style.opacity = '0';
          node.style.transform = 'translateX(200px)';
          node.style.transition = 'opacity 1000ms ease, transform 1000ms ease';

          if (prefersReducedMotion) {
            node.style.opacity = '1';
            node.style.transform = 'translateX(0)';
            return;
          }

          const timer = window.setTimeout(() => {
            node.style.opacity = '1';
            node.style.transform = 'translateX(0)';
          }, delayMs);
          cleanups.push(() => {
            window.clearTimeout(timer);
            node.style.opacity = '1';
            node.style.transform = 'translateX(0)';
          });
        };

        animateSlideIn(line1, 0);
        animateSlideIn(line2, 300);
        return;
      }

      const lineBlur = root.querySelector('.lineblur');
      const lineB = root.querySelector('.lineB');

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

      if (lineBlur && lineBlur.dataset.animDone !== '1') {
        lineBlur.dataset.animDone = '1';
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
        lineB.dataset.animDone = '1';
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

      if (prefersReducedMotion) {
        nodes.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      if (!('IntersectionObserver' in window)) {
        nodes.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      const timers = new Map();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const index = Number(entry.target.getAttribute('data-fade-index')) || 0;
            const delayMs = 90 + (index * 90);
            const timer = window.setTimeout(() => {
              requestAnimationFrame(() => {
                entry.target.classList.add('is-visible');
              });
              timers.delete(entry.target);
            }, delayMs);

            timers.set(entry.target, timer);
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px' },
      );

      nodes.forEach((el, index) => {
        el.classList.remove('is-visible');
        el.setAttribute('data-fade-index', String(index % 8));
        observer.observe(el);
      });
      cleanups.push(() => {
        observer.disconnect();
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
      });
    };

    const runFadeOut = () => {
      const nodes = Array.from(root.querySelectorAll('.fade-out'));
      if (!nodes.length) {
        return;
      }

      if (prefersReducedMotion) {
        nodes.forEach((el) => {
          el.style.setProperty('--scroll-opacity', '1');
          el.classList.remove('is-fading');
        });
        return;
      }

      let rafId = 0;

      const update = () => {
        rafId = 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const startY = vh * 0.12;
        const endY = -vh * 0.24;

        nodes.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const progress = clamp((startY - rect.top) / (startY - endY), 0, 1);
          const opacity = 1 - (0.58 * progress);
          el.style.setProperty('--scroll-opacity', opacity.toFixed(3));
          if (progress > 0.04) {
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
        nodes.forEach((el) => {
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
