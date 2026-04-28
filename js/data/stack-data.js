const SVG_DIRECTORY = "../../assets/svg/";

export const stackCatalog = {
  html: {
    label: "HTML5",
    assetFile: "html.svg",
    homeAriaLabel: "HTML5 Badge",
  },
  css: {
    label: "CSS3",
    assetFile: "css.svg",
    homeAriaLabel: "CSS3 Badge",
  },
  javascript: {
    label: "JavaScript",
    assetFile: "js.svg",
    homeAriaLabel: "JavaScript Badge",
  },
  figma: {
    label: "Figma",
    assetFile: "figma.svg",
    homeAriaLabel: "Figma Badge",
  },
  github: {
    label: "GitHub",
    assetFile: "github.svg",
    homeAriaLabel: "GitHub Badge",
  },
  wordpress: {
    label: "WordPress",
    assetFile: "wordpress.svg",
    homeAriaLabel: "WordPress Badge",
  },
  react: {
    label: "React",
    assetFile: "react.svg",
    homeAriaLabel: "React Js Badge",
  },
  nodejs: {
    label: "NodeJs",
    assetFile: "nodejs.svg",
    homeAriaLabel: "NodeJs Badge",
  },
  tailwind: {
    label: "Tailwind CSS",
    assetFile: "tailwind.svg",
    homeAriaLabel: "Tailwind Badge",
  },
  sass: {
    label: "Sass",
    assetFile: "sass.svg",
    homeAriaLabel: "Sass Badge",
  },
  typescript: {
    label: "TypeScript",
    assetFile: "typescript.svg",
  },
  vite: {
    label: "Vite",
    assetFile: "vite.svg",
  },
  "custom-wordpress": {
    label: "Custom WordPress",
    assetFile: "wordpress.svg",
  },
  php: {
    label: "PHP",
    assetFile: "php.svg",
  },
  css3: {
    label: "CSS3",
    assetFile: "css.svg",
  },
  "responsive-design": {
    label: "Responsive Design",
    assetFile: "responsive-design.svg",
  },
  "ux-strategy": {
    label: "UX Strategy",
    assetFile: "ux-strategy.svg",
  },
  "visual-design": {
    label: "Visual Design",
    assetFile: "visual-design.svg",
  },
};

export const homeStackIds = [
  "react",
  "vite",
  "typescript",
  "javascript",
  "html",
  "css",
  "tailwind",
  "sass",
  "figma",
  "wordpress",
];

export const experienceStackIds = [
  "react",
  "typescript",
  "javascript",
  "tailwind",
  "html",
  "css",
  "figma",
  "wordpress",
];

export function getStackItem(id) {
  if (!id) {
    return null;
  }

  const stackItem = stackCatalog[id];

  if (!stackItem) {
    return null;
  }

  return {
    id,
    label: stackItem.label,
    assetPath: resolveStackAssetPath(stackItem.assetFile),
    homeAriaLabel: stackItem.homeAriaLabel ?? `${stackItem.label} Badge`,
  };
}

export function getStackItems(ids) {
  return ids.map((id) => getStackItem(id)).filter(Boolean);
}

function resolveStackAssetPath(assetFile) {
  if (!assetFile) {
    return null;
  }

  return new URL(`${SVG_DIRECTORY}${assetFile}`, import.meta.url).href;
}
