import {
  experienceStackIds,
  getStackItems,
  homeStackIds,
} from "../data/stack-data.js";

export function initStackVisuals(ui) {
  renderStackGroup(ui.homeStack, getStackItems(homeStackIds), createHomeStackCard);
  renderStackGroup(
    ui.experienceStack,
    getStackItems(experienceStackIds),
    createExperienceStackCard,
  );
}

function createHomeStackCard(item) {
  if (!item.assetPath) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "tech-card";
  wrapper.setAttribute("role", "img");
  wrapper.setAttribute("aria-label", item.homeAriaLabel);

  const icon = document.createElement("img");
  icon.className = "tech-card__icon";
  icon.src = item.assetPath;
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.addEventListener("error", () => {
    wrapper.remove();
  });

  wrapper.append(icon);

  return wrapper;
}

function createExperienceStackCard(item) {
  if (!item.assetPath) {
    return null;
  }

  const listItem = document.createElement("li");
  listItem.className = "experience-stack__item";

  const icon = document.createElement("img");
  icon.className = "experience-stack__icon";
  icon.src = item.assetPath;
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.addEventListener("error", () => {
    listItem.remove();
  });

  const label = document.createElement("span");
  label.className = "experience-stack__label";
  label.textContent = item.label;

  listItem.append(icon, label);

  return listItem;
}

function renderStackGroup(container, stackItems, createNode) {
  if (!container) {
    return;
  }

  const items = stackItems.map((item) => createNode(item)).filter(Boolean);
  container.replaceChildren(...items);
}
