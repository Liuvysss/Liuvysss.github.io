import { updateProgressRing } from "../modules/animations.js";

export function initScrollUi(ui) {
  const { header, backToTopButton } = ui;

  if (!header && !backToTopButton) {
    return;
  }

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

    header?.classList.toggle("scrolled", scrollTop > 50);

    if (backToTopButton) {
      backToTopButton.classList.toggle("visible", scrollTop > 500);
      updateProgressRing(backToTopButton, scrollRatio);
    }
  };

  backToTopButton?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
