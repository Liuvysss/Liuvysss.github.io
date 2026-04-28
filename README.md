# README – Junior Frontend Developer Portfolio

## Overview

This portfolio is a data-driven, single-page frontend portfolio built with semantic HTML, modular CSS, and vanilla JavaScript. It presents featured work, experience, and contact information through production-oriented UI patterns including a responsive project carousel, an accessible project drawer, and a full-size image lightbox.

The project is designed to demonstrate real-world frontend engineering decisions such as centralized content management, reusable rendering logic, responsive layout systems, and accessibility-first interaction design.

Project content, stack metadata, and project media are driven from shared data modules, allowing the interface to scale without rewriting the main page structure.

---

## Features

- Data-driven featured project system powered by centralized project metadata
- Interactive project cards with image-first presentation and detail access
- Project drawer with synchronized top and bottom navigation between projects
- Responsive image carousel with indicators, swipe support, and full-size lightbox view
- Deep linking for project state using URL query parameters
- Reusable SVG-based technology rendering across the hero, experience, and project drawer
- Responsive single-page layout with desktop and mobile navigation flows
- Accessible interaction patterns including skip links, focus trapping, keyboard support, and inert background handling
- Contact form with client-side validation and success-state feedback

---

## Technical Notes

- Built with semantic HTML, component-scoped CSS, and vanilla ES modules
- Application bootstrapping handled through `js/main.js` with clear module separation by concern
- Project content centralized in `js/data/portfolio-data.js` for scalable card, drawer, and gallery rendering
- Technology metadata centralized in `js/data/stack-data.js` and resolved from `assets/svg/`
- Drawer and lightbox behavior implemented in `js/modules/projects.js` with shared state management
- Accessibility considerations include ARIA labeling, focus restoration, keyboard navigation, and scroll locking without layout shift
- Responsive behavior is driven by reusable layout tokens and component-level breakpoints rather than hardcoded one-off overrides
- The frontend is static, but `/api/contact` requires a Node serverless runtime such as Vercel Functions or Netlify Functions
- Contact email delivery uses Resend and must be configured with runtime environment variables

---

## How to Use

1. Homepage
    - Review the hero, experience, and featured project sections
    - Use the primary navigation to jump between sections of the page
2. Projects
    - Scroll through featured projects with the project carousel controls
    - Flip a project card and select “View Details” to open the drawer
3. Project Drawer
    - Review the project summary, role, technology stack, goals, results, and external links
    - Navigate between projects using the top or bottom previous/next controls
4. Project Media
    - Browse gallery images inside the drawer carousel
    - Open any project image in the full-size viewer and navigate with arrows, image click, or keyboard keys
5. Contact
    - Complete the contact form in the final section
    - Submit the form to view the confirmation state

---

## How to Run

1. Clone or download the project files
2. Install dependencies with `npm install`
3. For frontend-only preview, run `python3 -m http.server 4173` from the project root and open `http://localhost:4173`

Or

Open `index.html` directly in a browser
Or use a local development server such as VS Code Live Server
