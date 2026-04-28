import { updateActiveNavLink } from "../core/nav.js";
import { revealElement } from "./animations.js";
import { createObserver } from "./observer.js";

export function initRevealObserver(ui) {
  const revealTargets = document.querySelectorAll(".animate-on-scroll");
  const revealObserver = createObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -6% 0px",
      threshold: 0.16,
    },
  );

  if (!revealObserver) {
    revealTargets.forEach((target) => revealElement(target));
  } else {
    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  if (ui.sections.length === 0) {
    return;
  }

  const sectionObserver = createObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (visibleSection) {
        updateActiveNavLink(visibleSection.target.id);
      }
    },
    {
      rootMargin: "-18% 0px -45% 0px",
      threshold: [0.25, 0.5, 0.75],
    },
  );

  if (!sectionObserver) {
    return;
  }

  ui.sections.forEach((section) => sectionObserver.observe(section));
}
