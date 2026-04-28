export function revealElement(element) {
  element.classList.add("in-view");
}

export function updateProgressRing(button, progressRatio) {
  const path = button?.querySelector("path");

  if (!path) {
    return;
  }

  const pathLength = 308;
  const clampedRatio = Math.min(Math.max(progressRatio, 0), 1);
  path.style.strokeDashoffset = String(pathLength - pathLength * clampedRatio);
}
