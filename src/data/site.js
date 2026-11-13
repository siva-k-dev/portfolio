// Site-wide metadata, in one place. Read at build time by scripts/vite-plugin-seo.js
// (sitemap, robots.txt, llms.txt, prerendered route HTML) and at runtime by
// src/lib/seo.js (title, description and canonical on client-side navigation).
// The absolute site URL is not here: vite.config.js derives it from the repo and
// injects it as __SITE_URL__ so a repo rename cannot leave stale links behind.
export const site = {
  name: 'Siva K',
  jobTitle: 'Python Backend Developer',
  title: 'Siva K | Python Backend Developer — Django & DRF',
  description:
    'Portfolio of Siva K, a backend-focused Python developer building secure, scalable REST APIs with Django and Django REST Framework for enterprise identity governance.',
  ogImage: 'og-image.png', // 1200x630, relative to the site root
  github: 'https://github.com/siva-k-dev',
  linkedin: 'https://www.linkedin.com/in/siva-k-dev/',
  resume: 'Siva_K_Backend_Developer_Resume.pdf',
  knowsAbout: [
    'Python',
    'Django',
    'Django REST Framework',
    'REST API design',
    'Identity and Access Management',
    'Identity Governance and Administration',
    'MySQL',
    'Docker',
    'Model Context Protocol',
  ],
  blog: {
    title: 'Articles | Siva K — Python Backend Developer',
    description:
      'Articles by Siva K on backend engineering with Python and Django, identity governance, API security, and security research.',
  },
}
