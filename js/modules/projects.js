import {
  featuredPortfolioProjects,
  getProjectBySlug,
} from "../data/portfolio-data.js";
import { getStackItems } from "../data/stack-data.js";

const ACTIVE_QUERY_KEY = "project";
const CARD_DELAY_CLASSES = ["delay-1", "delay-2", "delay-3"];
const EXPLICIT_FLIP_CLASS = "is-flipped";
const DRAWER_VISIBLE_CLASS = "is-visible";
const BODY_DRAWER_OPEN_CLASS = "drawer-open";
const BODY_IMAGE_VIEWER_OPEN_CLASS = "image-viewer-open";
const CAROUSEL_SWIPE_THRESHOLD = 48;
const PROJECT_RAIL_EDGE_THRESHOLD = 8;
const MINIMUM_GALLERY_ITEMS = 3;
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");
const GALLERY_PLACEHOLDERS = [
  {
    kind: "placeholder",
    title: "Additional Screen",
    description: "Space reserved for a future interface view.",
  },
  {
    kind: "placeholder",
    title: "Responsive Detail",
    description: "Use this slot for another screen, state, or device preview.",
  },
];

export function initProjectShowcase(ui) {
  const {
    projectList,
    projectDrawer,
    projectDrawerOverlay,
    projectImageViewer,
    projectImageViewerOverlay,
  } = ui;

  if (
    !projectList ||
    !projectDrawer ||
    !projectDrawerOverlay ||
    !projectImageViewer ||
    !projectImageViewerOverlay
  ) {
    return;
  }

  const state = {
    featuredProjects: featuredPortfolioProjects,
    activeSlug: null,
    activeGallery: [],
    activeSlideIndex: 0,
    activeImageGallery: [],
    activeImageIndex: -1,
    activeImageProjectTitle: "",
    lastFocusedElement: null,
    imageViewerLastFocusedElement: null,
    hideDrawerTimer: 0,
    hideImageViewerTimer: 0,
    projectListSyncFrame: 0,
    pointerStartX: null,
    pointerStartY: null,
    pointerId: null,
    inertTargets: [
      ui.header,
      ui.mainContent,
      ui.footer,
      ui.backToTopButton,
      ui.mobileMenuSidebar,
      ui.mobileMenuOverlay,
    ].filter(Boolean),
  };

  renderProjectCards(projectList, state.featuredProjects);
  bindProjectShowcase(ui, state);
  syncProjectWithUrl(ui, state, { historyMode: "replace", restoreFocus: false });
}

function bindProjectShowcase(ui, state) {
  bindProjectRail(ui, state);

  ui.projectList.addEventListener("click", (event) => {
    const revealButton = event.target.closest("[data-project-reveal]");
    if (revealButton instanceof HTMLButtonElement) {
      event.preventDefault();
      revealProjectCard(ui.projectList, revealButton.closest("[data-project-card]"));
      return;
    }

    const openButton = event.target.closest("[data-project-open]");
    if (openButton instanceof HTMLButtonElement) {
      event.preventDefault();
      openProjectDrawer(ui, state, openButton.dataset.projectOpen, {
        historyMode: "push",
        restoreFocus: true,
      });
    }
  });

  ui.projectList.addEventListener("focusout", (event) => {
    const currentCard = event.target.closest("[data-project-card]");

    if (!(currentCard instanceof HTMLElement)) {
      return;
    }

    requestAnimationFrame(() => {
      if (!currentCard.contains(document.activeElement)) {
        currentCard.classList.remove(EXPLICIT_FLIP_CLASS);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }

    if (ui.projectDrawer.contains(event.target) || ui.projectList.contains(event.target)) {
      return;
    }

    resetFlippedCards(ui.projectList);
  });

  ui.projectDrawerOverlay.addEventListener("click", () => {
    closeProjectDrawer(ui, state, { historyMode: "push", restoreFocus: true });
  });

  ui.projectDrawerCloseButton?.addEventListener("click", () => {
    closeProjectDrawer(ui, state, { historyMode: "push", restoreFocus: true });
  });

  ui.projectImageViewerOverlay?.addEventListener("click", () => {
    closeProjectImageViewer(ui, state, { restoreFocus: true });
  });

  ui.projectImageViewerCloseButton?.addEventListener("click", () => {
    closeProjectImageViewer(ui, state, { restoreFocus: true });
  });

  ui.projectDrawer.addEventListener("click", (event) => {
    const previousButton = event.target.closest("[data-project-carousel-prev]");
    if (previousButton instanceof HTMLButtonElement) {
      event.preventDefault();
      stepCarousel(ui, state, -1);
      return;
    }

    const nextButton = event.target.closest("[data-project-carousel-next]");
    if (nextButton instanceof HTMLButtonElement) {
      event.preventDefault();
      stepCarousel(ui, state, 1);
      return;
    }

    const navigationButton = event.target.closest("[data-project-nav]");
    if (navigationButton instanceof HTMLButtonElement) {
      event.preventDefault();
      const direction = navigationButton.dataset.projectNav === "prev" ? -1 : 1;
      cycleProject(ui, state, direction);
      return;
    }

    const indicatorButton = event.target.closest("[data-project-carousel-indicator]");
    if (indicatorButton instanceof HTMLButtonElement) {
      event.preventDefault();
      const nextIndex = Number.parseInt(
        indicatorButton.dataset.projectCarouselIndicator ?? "",
        10,
      );

      if (Number.isInteger(nextIndex)) {
        setCarouselSlide(ui, state, nextIndex);
      }
      return;
    }

    const imageButton = event.target.closest("[data-project-image-open]");
    if (imageButton instanceof HTMLButtonElement) {
      event.preventDefault();
      const nextIndex = Number.parseInt(imageButton.dataset.projectImageOpen ?? "", 10);

      if (Number.isInteger(nextIndex)) {
        openProjectImageViewer(ui, state, nextIndex, {
          restoreFocus: true,
        });
      }
    }
  });

  ui.projectDrawer.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      trapFocus(event, ui.projectDrawer);
      return;
    }

    if (!ui.projectDrawerCarousel?.contains(document.activeElement)) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepCarousel(ui, state, -1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepCarousel(ui, state, 1);
    }
  });

  ui.projectImageViewer.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      trapFocus(event, ui.projectImageViewer);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepProjectImageViewer(ui, state, -1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepProjectImageViewer(ui, state, 1);
    }
  });

  ui.projectImageViewer.addEventListener("click", (event) => {
    const navigationButton = event.target.closest("[data-project-image-nav]");
    if (navigationButton instanceof HTMLButtonElement) {
      event.preventDefault();
      const direction = navigationButton.dataset.projectImageNav === "prev" ? -1 : 1;
      stepProjectImageViewer(ui, state, direction);
      return;
    }

    const imageAdvanceButton = event.target.closest("[data-project-image-advance]");
    if (imageAdvanceButton instanceof HTMLButtonElement) {
      event.preventDefault();
      stepProjectImageViewer(ui, state, 1);
      return;
    }

    if (
      event.target instanceof Node &&
      !ui.projectImageViewerImageButton?.contains(event.target) &&
      !ui.projectImageViewerCloseButton?.contains(event.target)
    ) {
      closeProjectImageViewer(ui, state, { restoreFocus: true });
    }
  });

  ui.projectDrawerCarouselViewport?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    state.pointerId = event.pointerId;
    state.pointerStartX = event.clientX;
    state.pointerStartY = event.clientY;
  });

  ui.projectDrawerCarouselViewport?.addEventListener("pointerup", (event) => {
    if (state.pointerId !== event.pointerId || state.pointerStartX === null) {
      resetPointerState(state);
      return;
    }

    const deltaX = event.clientX - state.pointerStartX;
    const deltaY = event.clientY - state.pointerStartY;

    resetPointerState(state);

    if (
      Math.abs(deltaX) < CAROUSEL_SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    stepCarousel(ui, state, deltaX > 0 ? -1 : 1);
  });

  ui.projectDrawerCarouselViewport?.addEventListener("pointercancel", () => {
    resetPointerState(state);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (isProjectImageViewerOpen(state)) {
      event.preventDefault();
      closeProjectImageViewer(ui, state, { restoreFocus: true });
      return;
    }

    if (state.activeSlug) {
      event.preventDefault();
      closeProjectDrawer(ui, state, { historyMode: "push", restoreFocus: true });
      return;
    }

    const activeCard = ui.projectList.querySelector(`.${EXPLICIT_FLIP_CLASS}`);
    if (activeCard instanceof HTMLElement) {
      event.preventDefault();
      activeCard.classList.remove(EXPLICIT_FLIP_CLASS);
      activeCard.querySelector("[data-project-reveal]")?.focus();
    }
  });

  window.addEventListener("popstate", () => {
    syncProjectWithUrl(ui, state, { historyMode: false, restoreFocus: false });
  });
}

function bindProjectRail(ui, state) {
  ui.projectListPrevButton?.addEventListener("click", () => {
    scrollProjectRail(ui.projectList, -1);
  });

  ui.projectListNextButton?.addEventListener("click", () => {
    scrollProjectRail(ui.projectList, 1);
  });

  ui.projectList.addEventListener(
    "scroll",
    () => {
      queueProjectRailSync(ui, state);
    },
    { passive: true },
  );

  ui.projectList.addEventListener("keydown", (event) => {
    if (event.target !== ui.projectList) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollProjectRail(ui.projectList, -1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollProjectRail(ui.projectList, 1);
    }
  });

  window.addEventListener("resize", () => {
    queueProjectRailSync(ui, state);
  });

  queueProjectRailSync(ui, state);
}

function renderProjectCards(container, projects) {
  const fragment = document.createDocumentFragment();

  projects.forEach((project, index) => {
    fragment.append(createProjectCard(project, index));
  });

  container.replaceChildren(fragment);
}

function createProjectCard(project, index) {
  const article = document.createElement("article");
  article.className = `project-card animate-on-scroll ${getDelayClass(index)}`;
  article.dataset.projectCard = project.slug;
  article.dataset.projectSlug = project.slug;
  article.setAttribute("aria-label", project.title);

  const inner = document.createElement("div");
  inner.className = "project-card__inner";

  const front = document.createElement("div");
  front.className = "project-card__face project-card__face--front";

  const revealButton = document.createElement("button");
  revealButton.type = "button";
  revealButton.className = "project-card__reveal";
  revealButton.dataset.projectReveal = project.slug;
  revealButton.setAttribute("aria-label", `Reveal ${project.title} summary`);

  const preview = getProjectPreview(project);
  const image = document.createElement("img");
  image.className = "project-card__preview";
  image.src = preview.src;
  image.alt = preview.alt ?? `${project.title} preview`;
  image.loading = "lazy";
  image.decoding = "async";

  revealButton.append(image);
  front.append(revealButton);

  const back = document.createElement("div");
  back.className = "project-card__face project-card__face--back";

  const year = document.createElement("span");
  year.className = "project-card__year";
  year.textContent = project.year;

  const title = document.createElement("h3");
  title.className = "project-card__title";
  title.textContent = project.title;

  const summary = document.createElement("p");
  summary.className = "project-card__summary";
  summary.textContent = project.summary;

  const actions = document.createElement("div");
  actions.className = "project-card__actions";

  const primaryAction = document.createElement("button");
  primaryAction.type = "button";
  primaryAction.className = "project-card__action project-card__action--primary";
  primaryAction.dataset.projectOpen = project.slug;
  primaryAction.setAttribute("aria-label", `View details for ${project.title}`);
  primaryAction.textContent = "View Details";

  actions.append(primaryAction);
  back.append(year, title, summary, actions);
  inner.append(front, back);
  article.append(inner);

  return article;
}

function scrollProjectRail(container, direction) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  container.scrollBy({
    left: getProjectRailScrollAmount(container) * direction,
    behavior: "smooth",
  });
}

function getProjectRailScrollAmount(container) {
  const firstCard = container.querySelector("[data-project-card]");

  if (!(firstCard instanceof HTMLElement)) {
    return container.clientWidth * 0.9;
  }

  const styles = window.getComputedStyle(container);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const cardWidth = firstCard.getBoundingClientRect().width;

  return Math.max(cardWidth + gap, container.clientWidth * 0.92);
}

function queueProjectRailSync(ui, state) {
  if (state.projectListSyncFrame) {
    return;
  }

  state.projectListSyncFrame = window.requestAnimationFrame(() => {
    state.projectListSyncFrame = 0;
    syncProjectRailControls(ui);
  });
}

function syncProjectRailControls(ui) {
  if (!ui.projectList) {
    return;
  }

  const projectScroller = ui.projectList.closest(".project-scroller");
  const maxScrollLeft = Math.max(ui.projectList.scrollWidth - ui.projectList.clientWidth, 0);
  const isAtStart = ui.projectList.scrollLeft <= PROJECT_RAIL_EDGE_THRESHOLD;
  const isAtEnd =
    ui.projectList.scrollLeft >= maxScrollLeft - PROJECT_RAIL_EDGE_THRESHOLD;
  const hasOverflow = maxScrollLeft > PROJECT_RAIL_EDGE_THRESHOLD;

  if (ui.projectListPrevButton) {
    ui.projectListPrevButton.disabled = !hasOverflow || isAtStart;
  }

  if (ui.projectListNextButton) {
    ui.projectListNextButton.disabled = !hasOverflow || isAtEnd;
  }

  projectScroller?.classList.toggle("has-right-overflow", hasOverflow && !isAtEnd);
}

function revealProjectCard(container, card) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  resetFlippedCards(container);
  card.classList.add(EXPLICIT_FLIP_CLASS);

  const firstAction = card.querySelector("[data-project-open]");

  if (firstAction instanceof HTMLElement) {
    requestAnimationFrame(() => firstAction.focus());
  }
}

function resetFlippedCards(container) {
  container
    .querySelectorAll(`.${EXPLICIT_FLIP_CLASS}`)
    .forEach((card) => card.classList.remove(EXPLICIT_FLIP_CLASS));
}

function openProjectDrawer(ui, state, slug, options = {}) {
  closeProjectImageViewer(ui, state, { restoreFocus: false });

  const project = getFeaturedProjectBySlug(state.featuredProjects, slug);

  if (!project) {
    closeProjectDrawer(ui, state, {
      historyMode: options.historyMode ?? "replace",
      restoreFocus: false,
    });
    return;
  }

  const {
    historyMode = "push",
    restoreFocus = true,
    focusDrawer = true,
  } = options;

  clearTimeout(state.hideDrawerTimer);
  if (restoreFocus) {
    state.lastFocusedElement = document.activeElement;
  }
  state.activeSlug = project.slug;

  populateDrawer(ui, state, project);
  resetProjectDrawerScroll(ui);
  resetFlippedCards(ui.projectList);
  lockBackground(state.inertTargets);

  ui.projectDrawer.hidden = false;
  ui.projectDrawerOverlay.hidden = false;

  requestAnimationFrame(() => {
    ui.projectDrawer.classList.add(DRAWER_VISIBLE_CLASS);
    ui.projectDrawerOverlay.classList.add(DRAWER_VISIBLE_CLASS);
    resetProjectDrawerScroll(ui);
  });

  document.body.classList.add(BODY_DRAWER_OPEN_CLASS);

  if (historyMode) {
    updateProjectQueryParam(project.slug, historyMode);
  }

  if (focusDrawer) {
    ui.projectDrawerCloseButton?.focus();
  }
}

function closeProjectDrawer(ui, state, options = {}) {
  closeProjectImageViewer(ui, state, { restoreFocus: false });

  if (!state.activeSlug && ui.projectDrawer.hidden) {
    if (options.historyMode) {
      updateProjectQueryParam(null, options.historyMode);
    }
    return;
  }

  const { historyMode = "push", restoreFocus = true } = options;

  clearTimeout(state.hideDrawerTimer);
  ui.projectDrawer.classList.remove(DRAWER_VISIBLE_CLASS);
  ui.projectDrawerOverlay.classList.remove(DRAWER_VISIBLE_CLASS);
  document.body.classList.remove(BODY_DRAWER_OPEN_CLASS);
  unlockBackground(state.inertTargets);

  state.hideDrawerTimer = window.setTimeout(() => {
    ui.projectDrawer.hidden = true;
    ui.projectDrawerOverlay.hidden = true;
  }, 260);

  const lastFocusedElement = state.lastFocusedElement;
  state.activeSlug = null;
  state.activeGallery = [];
  state.activeSlideIndex = 0;
  state.activeImageGallery = [];
  state.activeImageIndex = -1;
  state.activeImageProjectTitle = "";
  resetPointerState(state);
  state.lastFocusedElement = null;

  if (ui.projectDrawerCarouselStatus) {
    ui.projectDrawerCarouselStatus.textContent = "";
  }

  if (historyMode) {
    updateProjectQueryParam(null, historyMode);
  }

  if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function populateDrawer(ui, state, project) {
  ui.projectDrawerYear.textContent = project.year;
  ui.projectDrawerTitle.textContent = project.title;
  ui.projectDrawerSummary.textContent = project.summary;
  ui.projectDrawerRole.textContent = project.role ?? "";
  ui.projectDrawerGoal.replaceChildren(...createDetailList(project.goal));
  ui.projectDrawerResults.replaceChildren(...createDetailList(project.results));
  populateDrawerNavigation(ui, state, project);
  renderCarousel(ui, state, project);
  ui.projectDrawerTech.replaceChildren(
    ...getStackItems(project.stack).map((item) => createTechItem(item)),
  );
  ui.projectDrawerLinks.replaceChildren(...createDrawerLinks(project));
}

function openProjectImageViewer(ui, state, imageIndex, options = {}) {
  if (state.activeImageGallery.length === 0 || !ui.projectImageViewerImage) {
    return;
  }

  clearTimeout(state.hideImageViewerTimer);

  if (options.restoreFocus) {
    state.imageViewerLastFocusedElement = document.activeElement;
  }

  ui.projectImageViewer.hidden = false;
  ui.projectImageViewerOverlay.hidden = false;
  setProjectImageViewerModalState(ui, true);
  setProjectImageViewerSlide(ui, state, imageIndex);

  requestAnimationFrame(() => {
    ui.projectImageViewer.classList.add(DRAWER_VISIBLE_CLASS);
    ui.projectImageViewerOverlay.classList.add(DRAWER_VISIBLE_CLASS);
  });

  ui.projectImageViewerCloseButton?.focus();
}

function closeProjectImageViewer(ui, state, options = {}) {
  if (!isProjectImageViewerOpen(state) && ui.projectImageViewer?.hidden) {
    return;
  }

  const { restoreFocus = true } = options;
  const lastFocusedElement = state.imageViewerLastFocusedElement;

  clearTimeout(state.hideImageViewerTimer);
  ui.projectImageViewer?.classList.remove(DRAWER_VISIBLE_CLASS);
  ui.projectImageViewerOverlay?.classList.remove(DRAWER_VISIBLE_CLASS);
  setProjectImageViewerModalState(ui, false);

  state.hideImageViewerTimer = window.setTimeout(() => {
    if (ui.projectImageViewer) {
      ui.projectImageViewer.hidden = true;
    }

    if (ui.projectImageViewerOverlay) {
      ui.projectImageViewerOverlay.hidden = true;
    }

    if (ui.projectImageViewerImage) {
      ui.projectImageViewerImage.removeAttribute("src");
      ui.projectImageViewerImage.alt = "";
    }

    if (ui.projectImageViewerStatus) {
      ui.projectImageViewerStatus.textContent = "";
    }
  }, 220);

  state.activeImageIndex = -1;
  state.imageViewerLastFocusedElement = null;

  if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function resetProjectDrawerScroll(ui) {
  const panel = ui.projectDrawerPanel;

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  panel.scrollLeft = 0;
  panel.scrollTop = 0;
  panel.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
}

function populateDrawerNavigation(ui, state, project) {
  const previousProject = getAdjacentProject(state.featuredProjects, project.slug, -1);
  const nextProject = getAdjacentProject(state.featuredProjects, project.slug, 1);
  const currentProjectIndex = state.featuredProjects.findIndex(
    (featuredProject) => featuredProject.slug === project.slug,
  );
  const position = currentProjectIndex >= 0 ? currentProjectIndex + 1 : 1;
  const statusText = `Project ${position} of ${state.featuredProjects.length}`;

  ui.projectDrawerNavStatuses?.forEach((statusNode) => {
    statusNode.textContent = statusText;
  });

  ui.projectDrawerNavPrevButtons?.forEach((button) => {
    button.disabled = !previousProject;
    button.setAttribute(
      "aria-label",
      previousProject
        ? `Open previous project: ${previousProject.title}`
        : "Previous project unavailable",
    );
  });

  ui.projectDrawerNavNextButtons?.forEach((button) => {
    button.disabled = !nextProject;
    button.setAttribute(
      "aria-label",
      nextProject
        ? `Open next project: ${nextProject.title}`
        : "Next project unavailable",
    );
  });
}

function renderCarousel(ui, state, project) {
  if (
    !ui.projectDrawerCarousel ||
    !ui.projectDrawerCarouselSlides ||
    !ui.projectDrawerCarouselIndicators
  ) {
    return;
  }

  const gallery = getProjectGallery(project);

  state.activeGallery = gallery;
  state.activeImageGallery = getViewableMediaItems(gallery);
  state.activeImageProjectTitle = project.title;
  state.activeSlideIndex = 0;

  ui.projectDrawerCarousel.setAttribute("aria-label", `${project.title} gallery`);
  let viewerIndex = 0;
  ui.projectDrawerCarouselSlides.replaceChildren(
    ...gallery.map((media, index) => {
      const nextViewerIndex = media.kind === "placeholder" ? null : viewerIndex++;
      return createCarouselSlide(media, project.title, index, nextViewerIndex);
    }),
  );
  ui.projectDrawerCarouselIndicators.replaceChildren(
    ...gallery.map((_, index) => createCarouselIndicator(index, gallery.length)),
  );

  const hasMultipleSlides = gallery.length > 1;
  ui.projectDrawerCarousel.classList.toggle("has-multiple", hasMultipleSlides);

  if (ui.projectDrawerCarouselPrev) {
    ui.projectDrawerCarouselPrev.hidden = !hasMultipleSlides;
  }

  if (ui.projectDrawerCarouselNext) {
    ui.projectDrawerCarouselNext.hidden = !hasMultipleSlides;
  }

  ui.projectDrawerCarouselIndicators.hidden = !hasMultipleSlides;

  setCarouselSlide(ui, state, 0);
}

function createCarouselSlide(media, projectTitle, index, viewerIndex = null) {
  const figure = document.createElement("figure");
  figure.className = "project-carousel__slide";
  figure.dataset.projectCarouselSlide = String(index);

  if (media.kind === "placeholder") {
    const placeholder = document.createElement("div");
    placeholder.className = "project-carousel__placeholder";
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute(
      "aria-label",
      media.alt ?? `${projectTitle} placeholder slide ${index + 1}`,
    );

    const icon = document.createElement("span");
    icon.className = "project-carousel__placeholder-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg viewBox="0 0 24 24">
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.6"
        />
        <path
          d="m7.5 15 3.2-3.5 2.4 2.4 2.8-3 2.1 2.3"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.6"
        />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      </svg>
    `;

    const title = document.createElement("p");
    title.className = "project-carousel__placeholder-title";
    title.textContent = media.title;

    const description = document.createElement("p");
    description.className = "project-carousel__placeholder-description";
    description.textContent = media.description;

    placeholder.append(icon, title, description);
    figure.append(placeholder);

    return figure;
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "project-carousel__image-trigger";
  trigger.dataset.projectImageOpen = String(viewerIndex);
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute(
    "aria-label",
    `Open full-size image ${index + 1} from ${projectTitle}`,
  );

  const image = document.createElement("img");
  image.className = "project-carousel__image";
  image.src = media.src;
  image.alt = media.alt ?? `${projectTitle} preview ${index + 1}`;
  image.loading = index === 0 ? "eager" : "lazy";
  image.decoding = "async";

  trigger.append(image);
  figure.append(trigger);

  return figure;
}

function createCarouselIndicator(index, totalSlides) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "project-carousel__indicator";
  button.dataset.projectCarouselIndicator = String(index);
  button.setAttribute("aria-label", `Show image ${index + 1} of ${totalSlides}`);

  return button;
}

function cycleProject(ui, state, direction) {
  const adjacentProject = getAdjacentProject(state.featuredProjects, state.activeSlug, direction);

  if (!adjacentProject) {
    return;
  }

  openProjectDrawer(ui, state, adjacentProject.slug, {
    historyMode: "push",
    restoreFocus: false,
    focusDrawer: false,
  });
}

function stepCarousel(ui, state, direction) {
  if (state.activeGallery.length < 2) {
    return;
  }

  setCarouselSlide(ui, state, state.activeSlideIndex + direction);
}

function setCarouselSlide(ui, state, nextIndex) {
  const totalSlides = state.activeGallery.length;

  if (totalSlides === 0) {
    return;
  }

  const normalizedIndex = ((nextIndex % totalSlides) + totalSlides) % totalSlides;
  state.activeSlideIndex = normalizedIndex;

  ui.projectDrawerCarouselSlides
    ?.querySelectorAll("[data-project-carousel-slide]")
    .forEach((slide, index) => {
      const isActive = index === normalizedIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      slide.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((element) => {
        if (isActive) {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", "-1");
        }
      });
    });

  ui.projectDrawerCarouselIndicators
    ?.querySelectorAll("[data-project-carousel-indicator]")
    .forEach((indicator, index) => {
      const isActive = index === normalizedIndex;
      indicator.classList.toggle("is-active", isActive);
      indicator.setAttribute("aria-pressed", String(isActive));

      if (isActive) {
        indicator.setAttribute("aria-current", "true");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });

  if (ui.projectDrawerCarouselStatus) {
    ui.projectDrawerCarouselStatus.textContent = `Image ${normalizedIndex + 1} of ${totalSlides}`;
  }
}

function stepProjectImageViewer(ui, state, direction) {
  if (!isProjectImageViewerOpen(state) || state.activeImageGallery.length < 2) {
    return;
  }

  setProjectImageViewerSlide(ui, state, state.activeImageIndex + direction);
}

function setProjectImageViewerSlide(ui, state, nextIndex) {
  const totalImages = state.activeImageGallery.length;

  if (totalImages === 0 || !ui.projectImageViewerImage) {
    return;
  }

  const normalizedIndex = ((nextIndex % totalImages) + totalImages) % totalImages;
  const media = state.activeImageGallery[normalizedIndex];

  if (!media?.src) {
    return;
  }

  state.activeImageIndex = normalizedIndex;
  ui.projectImageViewerImage.src = media.src;
  ui.projectImageViewerImage.alt =
    media.alt ?? `${state.activeImageProjectTitle} image ${normalizedIndex + 1}`;

  const labelPrefix = state.activeImageProjectTitle
    ? `${state.activeImageProjectTitle} image`
    : "Expanded project image";

  ui.projectImageViewer?.setAttribute(
    "aria-label",
    `${labelPrefix} ${normalizedIndex + 1} of ${totalImages}`,
  );

  if (ui.projectImageViewerStatus) {
    ui.projectImageViewerStatus.textContent = `Image ${normalizedIndex + 1} of ${totalImages}`;
  }

  syncProjectImageViewerControls(ui, state);
}

function syncProjectImageViewerControls(ui, state) {
  const totalImages = state.activeImageGallery.length;
  const hasMultipleImages = totalImages > 1;
  const currentImageNumber =
    state.activeImageIndex >= 0 ? state.activeImageIndex + 1 : 1;

  if (ui.projectImageViewerPrevButton) {
    ui.projectImageViewerPrevButton.hidden = !hasMultipleImages;
    ui.projectImageViewerPrevButton.disabled = !hasMultipleImages;
  }

  if (ui.projectImageViewerNextButton) {
    ui.projectImageViewerNextButton.hidden = !hasMultipleImages;
    ui.projectImageViewerNextButton.disabled = !hasMultipleImages;
  }

  if (ui.projectImageViewerImageButton) {
    ui.projectImageViewerImageButton.disabled = !hasMultipleImages;
    ui.projectImageViewerImageButton.setAttribute(
      "aria-label",
      hasMultipleImages
        ? `Show next image (${currentImageNumber} of ${totalImages})`
        : `Expanded image (${currentImageNumber} of ${totalImages})`,
    );
  }
}

function createDetailList(items) {
  const normalizedItems = Array.isArray(items) ? items : [items];

  const list = document.createElement("ul");
  list.className = "project-drawer__detail-list";

  normalizedItems
    .filter(Boolean)
    .forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      list.append(listItem);
    });

  return [list];
}

function createTechItem(item) {
  const listItem = document.createElement("li");
  listItem.className = "project-drawer__tech-item";

  const icon = document.createElement("img");
  icon.className = "project-drawer__tech-icon";
  icon.src = item.assetPath;
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";

  const label = document.createElement("span");
  label.textContent = item.label;

  listItem.append(icon, label);

  return listItem;
}

function createDrawerLinks(project) {
  const availableLinks = getProjectExternalLinks(project);

  if (availableLinks.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "project-drawer__empty";
    emptyState.textContent = "No links available for this project.";

    return [emptyState];
  }

  return availableLinks.map(({ label, href }) => {
    const link = document.createElement("a");
    link.className = "project-drawer__link";
    link.href = href;
    link.textContent = label;

    if (isExternalUrl(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${label} (opens in a new tab)`);
    }

    return link;
  });
}

function getProjectExternalLinks(project) {
  const explicitLinks = Array.isArray(project.externalLinks)
    ? project.externalLinks
        .filter((link) => link?.href && link?.label)
        .map(({ label, href }) => ({ label, href }))
    : [];
  const legacyLinks = [
    project.liveUrl ? { label: "Live Site", href: project.liveUrl } : null,
    project.repoUrl ? { label: "GitHub", href: project.repoUrl } : null,
  ].filter(Boolean);

  return [...explicitLinks, ...legacyLinks];
}

function syncProjectWithUrl(ui, state, options = {}) {
  const slug = new URL(window.location.href).searchParams.get(ACTIVE_QUERY_KEY);
  const project = getFeaturedProjectBySlug(state.featuredProjects, slug);

  if (project) {
    openProjectDrawer(ui, state, project.slug, {
      historyMode: options.historyMode ?? false,
      restoreFocus: options.restoreFocus ?? false,
      focusDrawer: true,
    });
    return;
  }

  if (slug) {
    updateProjectQueryParam(null, options.historyMode ?? "replace");
  }

  closeProjectDrawer(ui, state, {
    historyMode: false,
    restoreFocus: options.restoreFocus ?? false,
  });
}

function resetPointerState(state) {
  state.pointerId = null;
  state.pointerStartX = null;
  state.pointerStartY = null;
}

function setProjectImageViewerModalState(ui, isOpen) {
  document.body.classList.toggle(BODY_IMAGE_VIEWER_OPEN_CLASS, isOpen);

  if (ui.projectDrawer) {
    ui.projectDrawer.inert = isOpen;
  }
}

function lockBackground(targets) {
  targets.forEach((target) => {
    target.inert = true;
  });
}

function isProjectImageViewerOpen(state) {
  return state.activeImageIndex >= 0 && state.activeImageGallery.length > 0;
}

function unlockBackground(targets) {
  targets.forEach((target) => {
    target.inert = false;
  });
}

function trapFocus(event, container) {
  const focusableElements = [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hasAttribute("hidden"),
  );

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function updateProjectQueryParam(slug, historyMode) {
  const url = new URL(window.location.href);

  if (slug) {
    url.searchParams.set(ACTIVE_QUERY_KEY, slug);
  } else {
    url.searchParams.delete(ACTIVE_QUERY_KEY);
  }

  const method = historyMode === "replace" ? "replaceState" : "pushState";
  window.history[method]({}, "", url);
}

function getFeaturedProjectBySlug(projects, slug) {
  if (!slug) {
    return null;
  }

  const project = getProjectBySlug(slug);

  if (!project || project.featured === false) {
    return null;
  }

  return projects.find((item) => item.slug === slug) ?? null;
}

function getProjectPreview(project) {
  return project.gallery?.[0] ?? { src: "", alt: `${project.title} preview` };
}

function getProjectGallery(project) {
  const gallery = Array.isArray(project.gallery) && project.gallery.length > 0
    ? [...project.gallery]
    : [getProjectPreview(project)];

  if (gallery.length >= MINIMUM_GALLERY_ITEMS) {
    return gallery;
  }

  const placeholdersNeeded = MINIMUM_GALLERY_ITEMS - gallery.length;

  return [
    ...gallery,
    ...GALLERY_PLACEHOLDERS.slice(0, placeholdersNeeded).map((placeholder, index) => ({
      ...placeholder,
      alt: `${project.title} placeholder view ${gallery.length + index + 1}`,
    })),
  ];
}

function getViewableMediaItems(gallery) {
  return gallery.filter((media) => media?.kind !== "placeholder" && media?.src);
}

function getAdjacentProject(projects, slug, direction) {
  if (!slug || projects.length === 0) {
    return null;
  }

  const currentIndex = projects.findIndex((project) => project.slug === slug);

  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = (currentIndex + direction + projects.length) % projects.length;

  return projects[nextIndex] ?? null;
}

function getDelayClass(index) {
  return CARD_DELAY_CLASSES[index % CARD_DELAY_CLASSES.length];
}

function isExternalUrl(href) {
  return /^https?:\/\//.test(href);
}
