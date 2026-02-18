import { useEffect } from 'react';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseCountText(text) {
  const trimmed = (text || '').trim();
  const match = trimmed.match(/^-?[\d,.]+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const numericText = match[0].replace(/,/g, '');
  const value = Number.parseFloat(numericText);
  if (Number.isNaN(value)) {
    return null;
  }

  const decimals = (numericText.split('.')[1] || '').length;
  const suffix = trimmed.slice(match[0].length);

  return { value, decimals, suffix };
}

function formatCountValue(value, decimals) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

export default function useWpEnhancements(containerRef, contentKey) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const cleanups = [];

    const normalizePunctuationSpacing = () => {
      const textNodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const parentEl = node.parentElement;
        if (!parentEl || parentEl.closest('style,script')) {
          return;
        }
        const original = node.nodeValue || '';
        const normalized = original.replace(/\u00a0+(?=[.,;:!?])/gu, '').replace(/[ \t]+(?=[.,;:!?])/gu, '');
        if (normalized !== original) {
          node.nodeValue = normalized;
        }
      });
    };

    const stripHeroWpGunk = () => {
      const dimClasses = [
        'has-background-dim-0',
        'has-background-dim-10',
        'has-background-dim-20',
        'has-background-dim-30',
        'has-background-dim-40',
        'has-background-dim-50',
        'has-background-dim-60',
        'has-background-dim-70',
        'has-background-dim-80',
        'has-background-dim-90',
        'has-background-dim-100',
        'has-background-dim',
      ];

      root.querySelectorAll('.hero.wp-block-cover, .ag-hero.wp-block-cover').forEach((cover) => {
        cover.classList.remove('has-on-accent-alt-background-color', 'has-palette-445-background-color');
        cover.style.removeProperty('background');
        cover.style.removeProperty('background-color');

        const bg = cover.querySelector(':scope > .wp-block-cover__background');
        if (!bg) {
          return;
        }

        bg.classList.remove(
          ...dimClasses,
          'has-on-accent-alt-background-color',
          'has-palette-445-background-color',
          'has-background-gradient',
        );
        bg.style.removeProperty('background');
        bg.style.removeProperty('background-image');
        bg.style.removeProperty('background-color');
        bg.style.removeProperty('opacity');
        bg.style.backgroundImage = 'none';
        bg.style.backgroundColor = '#ffffff';
      });

      root.querySelectorAll('.page-header.hero, header.page-header.ag-hero').forEach((header) => {
        header.classList.remove('wpex-surface-2', 'background-image-page-header');
        header.style.removeProperty('background');
        header.style.removeProperty('background-image');
        header.style.removeProperty('background-color');
        header.style.backgroundImage = 'none';
        header.style.backgroundColor = '#ffffff';
      });
    };

    const normalizeHeroLayout = () => {
      root.querySelectorAll('.ag-hero.wp-block-cover').forEach((cover) => {
        cover.style.paddingLeft = '0';
        cover.style.paddingRight = '0';

        const inner = cover.querySelector(':scope > .wp-block-cover__inner-container');
        if (!inner) {
          return;
        }

        // Keep one content-width rail at the hero inner container and strip nested WP side padding.
        Array.from(inner.children).forEach((child) => {
          if (!(child instanceof HTMLElement)) {
            return;
          }
          child.style.width = '100%';
          child.style.marginLeft = '0';
          child.style.marginRight = '0';
          child.style.maxWidth = '100%';
          child.style.paddingLeft = '0';
          child.style.paddingRight = '0';
        });
      });
    };

    const normalizeCountupTypography = () => {
      root.querySelectorAll('.stat-number, .countup').forEach((el) => {
        el.style.removeProperty('letter-spacing');
        el.style.removeProperty('word-spacing');
        el.style.removeProperty('font-variant-numeric');
        el.style.removeProperty('font-feature-settings');
      });
    };

    const runLineIntro = () => {
      const line1 = root.querySelector('.line1');
      const line2 = root.querySelector('.line2');
      const run = (el, delayMs) => {
        if (!el || el.dataset.animDone === '1') {
          return;
        }
        el.dataset.animDone = '1';
        el.style.opacity = '0';
        el.style.transform = 'translateX(200px)';
        el.style.transition = `opacity 1000ms ease, transform 1000ms ease`;
        window.setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        }, delayMs);
      };
      run(line1, 0);
      run(line2, 300);
    };

    const runLoansBlurIntro = () => {
      const lineBlur = root.querySelector('.lineblur');
      if (lineBlur && lineBlur.dataset.animDone !== '1') {
        lineBlur.dataset.animDone = '1';
        lineBlur.style.opacity = '0';
        lineBlur.style.filter = 'blur(22px)';
        lineBlur.style.transition = 'opacity 3000ms ease, filter 3000ms ease';
        requestAnimationFrame(() => {
          lineBlur.style.opacity = '1';
          lineBlur.style.filter = 'blur(0px)';
        });
      }

      const lineB = root.querySelector('.lineB');
      if (!lineB || lineB.dataset.animDone === '1') {
        return;
      }
      lineB.dataset.animDone = '1';
      lineB.style.opacity = '0';
      lineB.style.transform = 'translateX(60px)';
      lineB.style.transition = 'opacity 2000ms ease, transform 2000ms ease';

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            window.setTimeout(() => {
              lineB.style.opacity = '1';
              lineB.style.transform = 'translateX(0)';
            }, 1300);
            observer.disconnect();
          });
        },
        { threshold: 0, rootMargin: '0px 0px -15% 0px' },
      );
      observer.observe(lineB);
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
      const onOrientation = () => window.setTimeout(setStackHeight, 150);
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onOrientation);

      cleanups.push(() => {
        window.clearTimeout(timer);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onOrientation);
      });
    };

    const runFadeOutOnScroll = () => {
      const els = Array.from(root.querySelectorAll('.fade-out'));
      if (!els.length) {
        return;
      }

      let ticking = false;
      const update = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const range = Math.max(1, vh * 0.05);
        els.forEach((el) => {
          const top = el.getBoundingClientRect().top;
          const progress = clamp((-top) / range, 0, 1);
          el.style.setProperty('--scroll-opacity', (1 - progress).toFixed(3));
        });
        ticking = false;
      };

      const onScroll = () => {
        if (ticking) {
          return;
        }
        ticking = true;
        requestAnimationFrame(update);
      };

      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      });
    };

    const runFadeUp = () => {
      const PRELOAD = 240;
      const HOLD = 140;
      const STAGGER = 70;
      const TICK_MS = 60;
      const nodes = Array.from(root.querySelectorAll('.fade-up'));
      if (!nodes.length) {
        return;
      }

      if (prefersReducedMotion) {
        nodes.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      const state = new Map();
      let idx = 0;
      nodes.forEach((el) => {
        state.set(el, { mode: 'idle', due: 0, idx: idx++ });
      });

      const inPreloadZone = (el, vh) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= vh + PRELOAD && rect.bottom >= 0;
      };

      let rafId = 0;
      let lastTick = 0;
      const tick = (now) => {
        if (now - lastTick >= TICK_MS) {
          lastTick = now;
          const vh = window.innerHeight || document.documentElement.clientHeight;
          state.forEach((entry, el) => {
            const onDeck = inPreloadZone(el, vh);
            if (onDeck) {
              if (entry.mode === 'idle') {
                entry.mode = 'pending';
                entry.due = now + HOLD + (entry.idx % 6) * STAGGER;
              }
              if (entry.mode === 'pending' && now >= entry.due) {
                el.classList.add('is-visible');
                entry.mode = 'visible';
              }
            } else {
              if (entry.mode === 'pending') {
                entry.mode = 'idle';
              }
              if (entry.mode === 'visible') {
                el.classList.remove('is-visible');
                entry.mode = 'idle';
              }
            }
          });
        }
        rafId = requestAnimationFrame(tick);
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) {
              return;
            }
            const toAdd = [];
            if (node.matches?.('.fade-up')) {
              toAdd.push(node);
            }
            node.querySelectorAll?.('.fade-up').forEach((el) => toAdd.push(el));
            toAdd.forEach((el) => {
              if (!state.has(el)) {
                state.set(el, { mode: 'idle', due: 0, idx: idx++ });
              }
            });
          });
        });
      });

      const onVisibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
        } else {
          lastTick = 0;
          rafId = requestAnimationFrame(tick);
        }
      };

      observer.observe(root, { childList: true, subtree: true });
      rafId = requestAnimationFrame(tick);
      document.addEventListener('visibilitychange', onVisibility);

      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
      });
    };

    const runCountUp = () => {
      const targets = Array.from(new Set([...root.querySelectorAll('.countup'), ...root.querySelectorAll('.stat-number')]));
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
        const { value, decimals, suffix } = parsed;
        el.style.removeProperty('letter-spacing');
        el.style.removeProperty('word-spacing');
        el.style.removeProperty('font-variant-numeric');
        el.style.removeProperty('font-feature-settings');
        const durationMs = 1800;
        const start = performance.now();
        const step = (now) => {
          const t = clamp((now - start) / durationMs, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = value * eased;
          el.textContent = `${formatCountValue(current, decimals)}${suffix}`;
          if (t < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = `${formatCountValue(value, decimals)}${suffix}`;
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

    if (!prefersReducedMotion) {
      runLineIntro();
      runLoansBlurIntro();
      runCarouselStack();
      runFadeOutOnScroll();
    }
    stripHeroWpGunk();
    normalizeHeroLayout();
    normalizeCountupTypography();
    normalizePunctuationSpacing();
    runFadeUp();
    runCountUp();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerRef, contentKey]);
}
