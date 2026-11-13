# MY-Portfolio-New
A developer portfolio built to highlight my journey as an SDE — featuring projects, problem-solving skills, and tech expertise.
Portfolio/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── Navbar.jsx   # Navigation bar with theme toggle
│   │   ├── Home.jsx     # Landing section
│   │   ├── About.jsx    # About section
│   │   ├── Skills.jsx   # Skills showcase
│   │   ├── Projects.jsx # Projects portfolio
│   │   ├── Experience.jsx # Work experience timeline
│   │   ├── Contact.jsx  # Contact form
│   │   └── Footer.jsx   # Footer section
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration

## Performance and SEO

Lighthouse 13 on the production build, served locally the way GitHub Pages serves it
(`npx vite preview --base /portfolio/`):

| Category       | Desktop | Mobile |
| -------------- | ------- | ------ |
| Performance    | 100     | 98     |
| Accessibility  | 100     | 100    |
| Best practices | 100     | 100    |
| SEO            | 100     | 100    |

What keeps it there, and where to look when changing things:

- **Hero 3D model** - `public/desktop_pc/scene.glb` is the Sketchfab export compressed
  with gltf-transform (meshopt geometry, 1024px WebP textures): 1.4 MB instead of 16 MB.
  It loads on the visitor's first interaction, never on phones, never under
  reduced-motion or data-saver (`src/components/HeroModel.jsx`). The regenerate
  command is in `src/components/canvas/Computers.jsx`. Keep `license.txt`: the model is
  CC-BY and its author must stay credited.
- **Code splitting** - only the navbar, hero and footer are in the first bundle. The
  sections below the hero, the blog routes and Three.js are separate chunks
  (`src/App.jsx`). They are mounted in one pass on purpose; see the note in
  `src/components/BelowTheFold.jsx` before trying to stagger them.
- **No infinite animations** - both a framer-motion loop and a CSS keyframe loop were
  measured on the hero scroll indicator; each cost seconds of main-thread time on a
  throttled phone, so decorative elements are static. One-shot entrance animations are
  fine.
- **Fonts** - Poppins and JetBrains Mono are self-hosted from `public/fonts` (latin subset,
  only the weights used) and declared in `src/index.css`; `index.html` preloads the hero
  weights. No Google Fonts request.
- **Analytics** - Microsoft Clarity starts on first interaction (or after 10 s), see
  `index.html`.
- **SEO** - `scripts/vite-plugin-seo.js` fills `__SITE_URL__` in `index.html`, prerenders a
  real `index.html` for `/blog/` and every article (own title, description, canonical,
  Open Graph, JSON-LD), and writes `sitemap.xml`, `robots.txt` (all crawlers allowed, AI
  crawlers listed explicitly) and `llms.txt`. Site-wide text lives in `src/data/site.js`;
  the site URL is derived from the repo in `vite.config.js` (override with `SITE_URL`).
  `src/lib/seo.js` keeps the tags right during client-side navigation.

To measure locally:

```bash
GITHUB_REPOSITORY=siva-k-dev/portfolio npm run build
MSYS_NO_PATHCONV=1 npx vite preview --base /portfolio/ --port 4173   # Git Bash needs MSYS_NO_PATHCONV
npx lighthouse http://127.0.0.1:4173/portfolio/ --preset=desktop --view
npx lighthouse http://127.0.0.1:4173/portfolio/ --view                 # mobile
```
