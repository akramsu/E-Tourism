// Hide Next.js error overlays and development indicators
(function() {
  // Function to hide error overlays
  function hideErrorOverlays() {
    const selectors = [
      '#__next-build-watcher',
      '#__next-error-overlay',
      '#__next-dev-overlay',
      '.__next-error-overlay',
      '.__next-dev-overlay',
      '[data-nextjs-dialog]',
      '[data-nextjs-dialog-overlay]',
      '[data-nextjs-toast]',
      '[data-overlay]',
      '[data-next-error]',
      'nextjs-portal'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.remove();
        }
      });
    });
  }

  // Hide on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideErrorOverlays);
  } else {
    hideErrorOverlays();
  }

  // Watch for dynamically added overlays
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        hideErrorOverlays();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Hide overlays periodically
  setInterval(hideErrorOverlays, 1000);
})();
