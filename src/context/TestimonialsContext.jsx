import { createContext, useContext, useMemo, useState } from 'react';
import { defaultTestimonialsLibrary } from '../data/testimonialsLibrarySeed';
import { normalizeTestimonialRecord } from '../lib/testimonials';

const STORAGE_KEY = 'agf-testimonials-library-v1';
const TestimonialsContext = createContext(null);

function normalizePayload(payload) {
  const source = Array.isArray(payload) ? payload : [];
  if (!source.length) {
    return defaultTestimonialsLibrary.map((item) => ({ ...item }));
  }

  const byId = new Map();
  defaultTestimonialsLibrary.forEach((item) => {
    const normalized = normalizeTestimonialRecord(item, item.id);
    byId.set(normalized.id, normalized);
  });

  source.forEach((item, index) => {
    const normalized = normalizeTestimonialRecord(item, `custom-${index + 1}`);
    if (normalized.quote && normalized.author) {
      byId.set(normalized.id, normalized);
    }
  });

  return Array.from(byId.values());
}

function readInitialTestimonials() {
  if (typeof window === 'undefined') {
    return normalizePayload(null);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizePayload(null);
    }
    return normalizePayload(JSON.parse(raw));
  } catch {
    return normalizePayload(null);
  }
}

function makeId() {
  return `testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function TestimonialsProvider({ children }) {
  const [testimonials, setTestimonials] = useState(readInitialTestimonials);

  const value = useMemo(() => {
    const persist = (nextValue) => {
      const normalized = normalizePayload(nextValue);
      setTestimonials(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage write failures
      }
      return normalized;
    };

    return {
      testimonials,
      addTestimonial: () => {
        const next = normalizeTestimonialRecord({
          id: makeId(),
          quote: '“New testimonial quote.”',
          author: 'Name, Organization',
          authorTitle: '',
          tags: ['services'],
        });
        persist([...testimonials, next]);
        return next.id;
      },
      updateTestimonial: (id, patch) => {
        if (!id) {
          return;
        }
        persist(testimonials.map((item) => {
          if (item.id !== id) {
            return item;
          }
          return normalizeTestimonialRecord({ ...item, ...(patch || {}) }, item.id);
        }));
      },
      removeTestimonial: (id) => {
        if (!id) {
          return;
        }
        persist(testimonials.filter((item) => item.id !== id));
      },
      bulkUpdateTestimonials: (updater) => {
        if (typeof updater !== 'function') {
          return;
        }
        const nextValue = updater(testimonials.map((item) => ({ ...item })));
        if (!Array.isArray(nextValue)) {
          return;
        }
        persist(nextValue);
      },
      resetTestimonials: () => persist(defaultTestimonialsLibrary),
    };
  }, [testimonials]);

  return <TestimonialsContext.Provider value={value}>{children}</TestimonialsContext.Provider>;
}

export function useTestimonials() {
  const context = useContext(TestimonialsContext);
  if (!context) {
    throw new Error('useTestimonials must be used within TestimonialsProvider');
  }
  return context;
}
