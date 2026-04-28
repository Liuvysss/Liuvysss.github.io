import { injectSpeedInsights } from "@vercel/speed-insights";
import { initContactForm } from "./core/contact.js";
import { initNavigation } from "./core/nav.js";
import { initScrollUi } from "./core/scroll.js";
import { getUiState, syncCurrentYear } from "./core/ui-state.js";
import { initProjectShowcase } from "./modules/projects.js";
import { initRevealObserver } from "./modules/reveal.js";
import { initStackVisuals } from "./modules/stacks.js";

document.addEventListener("DOMContentLoaded", () => {
  const ui = getUiState();

  // Initialize Vercel Speed Insights
  injectSpeedInsights();

  syncCurrentYear(ui.yearNodes);
  initStackVisuals(ui);
  initProjectShowcase(ui);
  initNavigation(ui);
  initScrollUi(ui);
  initRevealObserver(ui);
  initContactForm(ui);
});
