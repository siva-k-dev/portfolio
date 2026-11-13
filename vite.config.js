import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import seo from './scripts/vite-plugin-seo.js'

// The site uses a client-side router on static hosting, so a request for
// /blog/<slug> never matches a real file. GitHub Pages serves 404.html for
// unmatched paths while leaving the URL intact, so an exact copy of index.html
// lets the router resolve the route - deep links and refreshes then work.
// (scripts/vite-plugin-seo.js additionally prerenders a real index.html for
// every known route, so this copy only catches URLs that are genuinely unknown.)
//
// On other hosts use their own rewrite instead:
//   Netlify -> public/_redirects with:  /* /index.html 200
//   Vercel  -> vercel.json rewrite to /index.html
//   Nginx   -> try_files $uri $uri/ /index.html;
const spaFallback = () => ({
  name: 'spa-fallback-404',
  closeBundle() {
    const index = resolve(__dirname, 'dist/index.html')
    if (existsSync(index)) {
      copyFileSync(index, resolve(__dirname, 'dist/404.html'))
    }
  },
})

// A GitHub Pages *project* site is served from a subpath, not the domain root:
//   https://<owner>.github.io/<repo>/
// Without a matching base every bundle URL points at the domain root and 404s,
// leaving a blank page. Rather than hardcode the repo name - which breaks
// silently the next time the repo is renamed - derive it:
//
//   - GitHub Actions sets GITHUB_REPOSITORY to "owner/repo", so a project site
//     resolves to "/repo/" automatically and survives renames.
//   - A user site (owner.github.io) and custom domains serve from the root.
//   - Local builds default to "/"; set BASE_PATH to override.
//
// Dev always stays on "/" so localhost:3000 is unaffected. Runtime asset URLs
// go through src/lib/asset.js, so they follow whatever this resolves to.
const [owner, repoName] = (process.env.GITHUB_REPOSITORY || '').split('/')
const inferredBase = !repoName || repoName.endsWith('.github.io') ? '/' : `/${repoName}/`
const BASE = process.env.BASE_PATH || inferredBase

// The absolute site URL feeds the canonical link, Open Graph tags, JSON-LD,
// sitemap.xml and robots.txt. It is derived the same way as BASE so a rename
// cannot leave stale URLs behind. A local build has no GITHUB_REPOSITORY, so it
// falls back to the live site - that keeps a local Lighthouse run representative.
// Set SITE_URL to override (for example when a custom domain is attached).
const inferredSiteUrl = owner ? `https://${owner}.github.io${inferredBase}` : 'https://siva-k-dev.github.io/portfolio/'
const SITE_URL = (process.env.SITE_URL || inferredSiteUrl).replace(/\/?$/, '/')

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  define: {
    __SITE_URL__: JSON.stringify(SITE_URL),
  },
  plugins: [react(), spaFallback(), seo({ siteUrl: SITE_URL })],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks cache independently of app code. Three.js is not
        // listed on purpose: it only lives in the lazily loaded hero-model chunk.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
}))
