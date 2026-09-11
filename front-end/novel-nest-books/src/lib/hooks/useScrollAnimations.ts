'use client';

import { useEffect } from 'react';

export function useScrollAnimations() {
  useEffect(() => {
    // Check if the browser natively supports scroll-driven animations.
    // If it does, we don't need this polyfill/fallback.
    if (
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)')
    ) {
      return;
    }

    // Fallback for browsers that don't support animation-timeline (like Safari).
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          
          if (entry.isIntersecting) {
            // Apply a simple fallback transition
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0) scale(1) translateX(0)';
          } else if (entry.boundingClientRect.top > 0) {
            // Reset when scrolled past the top (so it animates again when scrolling down)
            el.style.opacity = '0';
            
            if (el.classList.contains('animate-on-scroll')) {
              el.style.transform = 'translateY(50px)';
            } else if (el.classList.contains('animate-on-scroll-scale')) {
              el.style.transform = 'scale(0.8)';
            } else if (el.classList.contains('animate-on-scroll-right')) {
              el.style.transform = 'translateX(-50px)';
            } else if (el.classList.contains('animate-on-scroll-left')) {
              el.style.transform = 'translateX(50px)';
            } else {
              el.style.transform = 'translateY(50px)';
            }
          }
        }
      },
      {
        // Trigger as soon as 10% of the element is visible
        threshold: 0.1,
      }
    );

    const animatedElements = document.querySelectorAll(
      '.animate-on-scroll, .animate-on-scroll-scale, .animate-on-scroll-right, .animate-on-scroll-left'
    );

    animatedElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Initialize states for fallback
      htmlEl.style.opacity = '0';
      if (htmlEl.classList.contains('animate-on-scroll')) {
        htmlEl.style.transform = 'translateY(50px)';
      } else if (htmlEl.classList.contains('animate-on-scroll-scale')) {
        htmlEl.style.transform = 'scale(0.8)';
      } else if (htmlEl.classList.contains('animate-on-scroll-right')) {
        htmlEl.style.transform = 'translateX(-50px)';
      } else if (htmlEl.classList.contains('animate-on-scroll-left')) {
        htmlEl.style.transform = 'translateX(50px)';
      }
      
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
