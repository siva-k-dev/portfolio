import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { site } from '../src/data/site.js'
import { sortedArticles } from '../src/data/articles.js'

// Everything a crawler needs that a single-page app does not give it by itself:
//
//   - __SITE_URL__ in index.html becomes the absolute site URL (canonical, Open
//     Graph, JSON-LD), in dev and in the build.
//   - The build writes a real index.html for /blog/ and every /blog/<slug>/ with
//     that page's own title, description, canonical and Open Graph tags. GitHub
//     Pages then answers those URLs with 200 and the right tags, instead of the
//     404.html fallback (which carries the home page's tags and a 404 status).
//   - sitemap.xml, robots.txt and llms.txt are generated from the same data, so
//     a new article is picked up without touching anything else.

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// JSON inside a <script> must not be able to close the tag.
const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

// Replace the quoted attribute value that follows `tagStart`, e.g.
//   setAttr(html, '<meta name="description" content="', 'New text')
const setAttr = (html, tagStart, value) =>
  html.replace(new RegExp(`(${tagStart})[^"]*"`), (_, start) => `${start}${escapeHtml(value)}"`)

const today = () => new Date().toISOString().slice(0, 10)

// Crawlers that fetch pages for AI assistants and AI search. All welcome, like
// every other crawler: the point of a portfolio is to be found.
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'Bytespider',
  'CCBot',
  'DuckAssistBot',
  'cohere-ai',
  'YouBot',
]

const buildPages = (siteUrl) => {
  const url = (path) => `${siteUrl}${path}`
  const ogImage = url(site.ogImage)
  const person = { '@type': 'Person', name: site.name, url: siteUrl }

  const home = {
    path: '',
    url: url(''),
    title: site.title,
    description: site.description,
    type: 'website',
    lastmod: today(),
    changefreq: 'monthly',
    priority: '1.0',
  }

  const blog = {
    path: 'blog/',
    url: url('blog/'),
    title: site.blog.title,
    description: site.blog.description,
    type: 'website',
    lastmod: sortedArticles[0]?.date ?? today(),
    changefreq: 'weekly',
    priority: '0.8',
  }

  const posts = sortedArticles.map((article) => {
    const path = `blog/${article.slug}/`
    const pageUrl = url(path)
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': pageUrl,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.date,
      keywords: article.tags.join(', '),
      inLanguage: 'en',
      image: ogImage,
      author: person,
      publisher: person,
    }
    return {
      path,
      url: pageUrl,
      title: `${article.title} | ${site.name}`,
      description: article.description,
      type: 'article',
      lastmod: article.date,
      changefreq: 'yearly',
      priority: '0.7',
      extraHead:
        `<meta property="article:published_time" content="${article.date}" />\n` +
        `    <meta property="article:author" content="${escapeHtml(site.name)}" />\n` +
        `    <script type="application/ld+json">${jsonForHtml(ld)}</script>`,
    }
  })

  return [home, blog, ...posts]
}

const applyMeta = (html, page) => {
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
  out = setAttr(out, '<meta name="description" content="', page.description)
  out = setAttr(out, '<link rel="canonical" href="', page.url)
  out = setAttr(out, '<meta property="og:type" content="', page.type)
  out = setAttr(out, '<meta property="og:title" content="', page.title)
  out = setAttr(out, '<meta property="og:description" content="', page.description)
  out = setAttr(out, '<meta property="og:url" content="', page.url)
  out = setAttr(out, '<meta name="twitter:title" content="', page.title)
  out = setAttr(out, '<meta name="twitter:description" content="', page.description)
  if (page.extraHead) out = out.replace('</head>', `${page.extraHead}\n  </head>`)
  return out
}

const buildSitemap = (pages) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages
    .map(
      (page) =>
        `  <url>\n` +
        `    <loc>${escapeHtml(page.url)}</loc>\n` +
        `    <lastmod>${page.lastmod}</lastmod>\n` +
        `    <changefreq>${page.changefreq}</changefreq>\n` +
        `    <priority>${page.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`

const buildRobots = (siteUrl) =>
  `# ${site.name} - ${site.jobTitle}\n` +
  `# Everyone is welcome to index this site, including AI assistants and AI search.\n\n` +
  `User-agent: *\nAllow: /\n\n` +
  `# AI crawlers, listed explicitly so there is no doubt they are allowed\n` +
  AI_CRAWLERS.map((bot) => `User-agent: ${bot}`).join('\n') +
  `\nAllow: /\n\n` +
  `Sitemap: ${siteUrl}sitemap.xml\n`

// https://llmstxt.org - a plain-text map of the site for AI agents and assistants.
const buildLlms = (siteUrl, pages) => {
  const posts = pages.filter((page) => page.type === 'article')
  const postLines = posts
    .map((page) => `- [${page.title.replace(` | ${site.name}`, '')}](${page.url}): ${page.description}`)
    .join('\n')

  return (
    `# ${site.name} — ${site.jobTitle}\n\n` +
    `> ${site.description}\n\n` +
    `${site.name} builds backend services and REST APIs with Python, Django and Django REST ` +
    `Framework, with a focus on identity and access management (IAM) and identity governance (IGA). ` +
    `This site is a personal portfolio: projects, skills, work experience, education, and articles.\n\n` +
    `## Pages\n\n` +
    `- [Portfolio home](${siteUrl}): about, skills, projects, GitHub activity, experience, education and contact\n` +
    `- [Articles](${siteUrl}blog/): writing on backend engineering, identity governance and security research\n` +
    `- [Resume (PDF)](${siteUrl}${site.resume})\n\n` +
    `## Articles\n\n${postLines}\n\n` +
    `## Elsewhere\n\n` +
    `- [GitHub](${site.github})\n` +
    `- [LinkedIn](${site.linkedin})\n`
  )
}

export default function seo({ siteUrl }) {
  const pages = buildPages(siteUrl)
  const generated = {
    '/sitemap.xml': ['application/xml; charset=utf-8', buildSitemap(pages)],
    '/robots.txt': ['text/plain; charset=utf-8', buildRobots(siteUrl)],
    '/llms.txt': ['text/plain; charset=utf-8', buildLlms(siteUrl, pages)],
  }

  let outDir = 'dist'
  let isBuild = false

  return {
    name: 'portfolio-seo',

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      isBuild = config.command === 'build'
    },

    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl)
    },

    // Serve the generated files in dev too, so they can be checked locally.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const hit = generated[(req.url || '').split('?')[0]]
        if (!hit) return next()
        res.setHeader('Content-Type', hit[0])
        res.end(hit[1])
      })
    },

    closeBundle() {
      if (!isBuild) return
      const indexPath = resolve(outDir, 'index.html')
      if (!existsSync(indexPath)) return
      const html = readFileSync(indexPath, 'utf8')

      for (const page of pages) {
        if (!page.path) continue // the home page is index.html itself
        const file = resolve(outDir, page.path, 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, applyMeta(html, page))
      }

      for (const [name, [, body]] of Object.entries(generated)) {
        writeFileSync(resolve(outDir, name.slice(1)), body)
      }
    },
  }
}
