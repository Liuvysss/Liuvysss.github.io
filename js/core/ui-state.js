export function getUiState() {
  return {
    header: document.getElementById("main-header"),
    mainContent: document.getElementById("main-content"),
    footer: document.querySelector("footer"),
    backToTopButton: document.getElementById("back-to-top"),
    mobileMenuButton: document.getElementById("mobile-menu-toggle"),
    mobileMenuSidebar: document.getElementById("mobile-menu-sidebar"),
    mobileMenuOverlay: document.getElementById("mobile-menu-overlay"),
    closeMenuButton: document.getElementById("close-menu-btn"),
    mobileNavLinks: [...document.querySelectorAll(".mobile-nav-link")],
    contactForm: document.getElementById("contactForm"),
    formSuccess: document.getElementById("formSuccess"),
    homeStack: document.querySelector("[data-home-stack]"),
    experienceStack: document.querySelector("[data-experience-stack]"),
    projectList: document.querySelector("[data-project-list]"),
    projectListPrevButton: document.querySelector("[data-project-list-prev]"),
    projectListNextButton: document.querySelector("[data-project-list-next]"),
    projectDrawer: document.querySelector("[data-project-drawer]"),
    projectDrawerPanel: document.querySelector(".project-drawer__panel"),
    projectDrawerOverlay: document.querySelector("[data-project-overlay]"),
    projectDrawerCloseButton: document.querySelector("[data-project-close]"),
    projectDrawerNavPrevButtons: [...document.querySelectorAll('[data-project-nav="prev"]')],
    projectDrawerNavNextButtons: [...document.querySelectorAll('[data-project-nav="next"]')],
    projectDrawerNavStatuses: [...document.querySelectorAll("[data-project-nav-status]")],
    projectDrawerYear: document.querySelector("[data-project-drawer-year]"),
    projectDrawerTitle: document.querySelector("[data-project-drawer-title]"),
    projectDrawerSummary: document.querySelector("[data-project-drawer-summary]"),
    projectDrawerRole: document.querySelector("[data-project-drawer-role]"),
    projectDrawerGoal: document.querySelector("[data-project-drawer-goal]"),
    projectDrawerResults: document.querySelector("[data-project-drawer-results]"),
    projectDrawerCarousel: document.querySelector("[data-project-carousel]"),
    projectDrawerCarouselViewport: document.querySelector(".project-carousel__viewport"),
    projectDrawerCarouselSlides: document.querySelector("[data-project-carousel-slides]"),
    projectDrawerCarouselPrev: document.querySelector("[data-project-carousel-prev]"),
    projectDrawerCarouselNext: document.querySelector("[data-project-carousel-next]"),
    projectDrawerCarouselIndicators: document.querySelector("[data-project-carousel-indicators]"),
    projectDrawerCarouselStatus: document.querySelector("[data-project-carousel-status]"),
    projectDrawerTech: document.querySelector("[data-project-drawer-tech]"),
    projectDrawerLinks: document.querySelector("[data-project-drawer-links]"),
    projectImageViewer: document.querySelector("[data-project-image-viewer]"),
    projectImageViewerOverlay: document.querySelector("[data-project-image-overlay]"),
    projectImageViewerPanel: document.querySelector("[data-project-image-panel]"),
    projectImageViewerCloseButton: document.querySelector("[data-project-image-close]"),
    projectImageViewerPrevButton: document.querySelector('[data-project-image-nav="prev"]'),
    projectImageViewerNextButton: document.querySelector('[data-project-image-nav="next"]'),
    projectImageViewerImageButton: document.querySelector("[data-project-image-advance]"),
    projectImageViewerImage: document.querySelector("[data-project-image-full]"),
    projectImageViewerStatus: document.querySelector("[data-project-image-status]"),
    yearNodes: [...document.querySelectorAll("[data-current-year]")],
    sections: [...document.querySelectorAll("section[id]")],
  };
}

export function syncCurrentYear(nodes) {
  const year = new Date().getFullYear().toString();
  nodes.forEach((node) => {
    node.textContent = year;
  });
}

export function setMenuState(ui, isOpen) {
  if (!ui.mobileMenuSidebar || !ui.mobileMenuOverlay) {
    return;
  }

  ui.mobileMenuSidebar.classList.toggle("active", isOpen);
  ui.mobileMenuOverlay.classList.toggle("active", isOpen);
  ui.mobileMenuButton?.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
}
