import { site } from '../data/site'

// Injected by vite.config.js; always ends with a slash.
const SITE_URL = __SITE_URL__

const setContent = (selector, value) => {
  const el = document.querySelector(selector)
  if (el) el.setAttribute('content', value)
}

// The build prerenders an index.html per route with the right tags already in
// place for crawlers. This keeps them right after client-side navigation, where
// the document is still the one the visitor first landed on.
export const setPageMeta = ({ title = site.title, description = site.description, path = '' } = {}) => {
  const url = `${SITE_URL}${String(path).replace(/^\/+/, '')}`

  document.title = title
  setContent('meta[name="description"]', description)
  setContent('meta[property="og:title"]', title)
  setContent('meta[property="og:description"]', description)
  setContent('meta[property="og:url"]', url)
  setContent('meta[name="twitter:title"]', title)
  setContent('meta[name="twitter:description"]', description)

  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', url)
}
