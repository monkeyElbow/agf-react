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

export default function useNativeEnhancements(containerRef) {
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

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = Number(entry.target.getAttribute('data-fade-index')) || 0;
              window.setTimeout(() => {
                entry.target.classList.add('is-visible');
              }, index * 75);
            } else {
              entry.target.classList.remove('is-visible');
            }
          });
        },
        { rootMargin: '0px 0px -12% 0px' },
      );

      nodes.forEach((el, index) => {
        el.setAttribute('data-fade-index', String(index % 8));
        observer.observe(el);
      });
      cleanups.push(() => observer.disconnect());
    };

    const runCountUp = () => {
      const targets = Array.from(root.querySelectorAll('.countup'));
      if (!targets.length) {
        return;
      }

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
            requestAnimationFrame(step);
          } else {
            el.textContent = `${prefix}${formatCountValue(value, decimals)}${suffix}`;
          }
        };
        requestAnimationFrame(step);
      };

      if (prefersReducedMotion) {
        targets.forEach((el) => animate(el));
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
      cleanups.push(() => observer.disconnect());
    };

    const runCarouselStack = () => {
      const stack = root.querySelector('.carousel-stack');
      if (!stack) {
        return;
      }
      const slides = Array.from(stack.querySelectorAll('.carousel-frame'));
      if (!slides.length) {
        return;
      }

      let current = 0;
      let timer = null;

      const setStackHeight = () => {
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

      const showSlide = (next) => {
        slides[current]?.classList.remove('is-active');
        slides[next]?.classList.add('is-active');
        current = next;
        timer = window.setTimeout(() => showSlide((current + 1) % slides.length), 6000);
      };

      setStackHeight();
      document.fonts?.ready?.then(setStackHeight);
      slides[current].classList.add('is-active');
      timer = window.setTimeout(() => showSlide((current + 1) % slides.length), 6000);

      const onResize = () => setStackHeight();
      window.addEventListener('resize', onResize);
      cleanups.push(() => {
        window.clearTimeout(timer);
        window.removeEventListener('resize', onResize);
      });
    };

    runHeroHeadingReveal();
    runFadeUp();
    runCountUp();
    runCarouselStack();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerRef]);
}
