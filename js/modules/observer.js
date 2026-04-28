const defaultOptions = {
  root: null,
  rootMargin: "0px 0px -10% 0px",
  threshold: 0.2,
};

export function createObserver(callback, options = {}) {
  if (!("IntersectionObserver" in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    ...defaultOptions,
    ...options,
  });
}
