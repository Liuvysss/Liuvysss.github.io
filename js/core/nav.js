import { setMenuState } from "./ui-state.js";

export function initNavigation(ui) {
  if (!ui.mobileMenuButton || !ui.mobileMenuSidebar || !ui.mobileMenuOverlay) {
    return;
  }

  ui.mobileMenuButton.addEventListener("click", () => {
    const isOpen = ui.mobileMenuSidebar.classList.contains("active");
    setMenuState(ui, !isOpen);
  });

  ui.closeMenuButton?.addEventListener("click", () => setMenuState(ui, false));
  ui.mobileMenuOverlay.addEventListener("click", () => setMenuState(ui, false));

  ui.mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(ui, false));
  });
}

export function updateActiveNavLink(sectionId) {
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");

  navLinks.forEach((link) => {
    const matchesSection = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("active", matchesSection);
    if (matchesSection) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}
