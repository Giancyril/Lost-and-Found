import { useEffect } from "react";

/**
 * useScrollReveal Hook
 * Standardized scroll-reveal observer that handles dynamic content using MutationObserver.
 * It automatically observes any element with the '.reveal' class.
 */
export const useScrollReveal = () => {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          // Once revealed, we can stop observing this specific element
          // revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Initial scan
    const scanAndObserve = () => {
      const elements = document.querySelectorAll(".reveal:not(.active)");
      elements.forEach((el) => revealObserver.observe(el));
    };

    scanAndObserve();

    // Use MutationObserver to detect new .reveal elements added to the DOM
    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};
