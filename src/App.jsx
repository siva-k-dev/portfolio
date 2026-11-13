import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { IconContext } from 'react-icons'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Footer from './components/Footer'
import { setPageMeta } from './lib/seo'

// Only the navbar, hero and footer are in the initial bundle. The sections under
// the hero, and the blog routes, arrive as separate chunks so the first paint
// waits for as little JavaScript as possible. (The 3D hero model is split off
// further still - see components/HeroModel.jsx.)
const BelowTheFold = lazy(() => import('./components/BelowTheFold'))
const Blog = lazy(() => import('./components/Blog'))
const BlogPost = lazy(() => import('./components/BlogPost'))

// Some react-icons sets (Simple Icons) render role="img", which screen readers
// then announce as an unnamed image. Every icon on this site sits next to its
// text label or inside a link/button that carries aria-label, so mark them all
// decorative once here rather than on each of the ~100 usages.
const ICON_CONTEXT = { attr: { 'aria-hidden': 'true', focusable: 'false' } }

const NAV_OFFSET = 80 // fixed navbar height, so section headings clear it

// Depending on layout, either the document or the app root is the scroll container.
const getScroller = () => {
  const root = document.getElementById('app-root')
  if (root && root.scrollHeight > root.clientHeight + 10) return root
  return null // means: use the window
}

const scrollToTop = () => {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  const root = document.getElementById('app-root')
  if (root) root.scrollTop = 0
}

// index.css sets scroll-behavior: smooth globally, so scrolls animate by default.
// That is right for a short in-page hop, but crawling thousands of pixels after
// arriving from another route is not - jump instantly when the distance is large.
const alignTo = (target) => {
  const scroller = getScroller()
  const current = scroller ? scroller.scrollTop : window.scrollY
  const top = Math.max(0, target.getBoundingClientRect().top + current - NAV_OFFSET)
  // 'auto' would defer to the CSS value (smooth); 'instant' is what actually jumps.
  const behavior = Math.abs(top - current) > window.innerHeight * 2 ? 'instant' : 'smooth'

  if (scroller) scroller.scrollTo({ top, behavior })
  else window.scrollTo({ top, behavior })
}

const ScrollManager = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      scrollToTop()
      return undefined
    }

    // Coming from /blog the portfolio has to mount before the section exists, and
    // the sections themselves are a lazy chunk, so poll briefly for the target -
    // then align exactly once. Repeatedly re-scrolling would restart the smooth
    // animation on every tick and never settle.
    let cancelled = false
    let attempts = 0
    let timer = null

    const align = () => {
      if (cancelled) return
      const target = document.querySelector(hash)
      if (target) {
        alignTo(target)
        return
      }
      attempts += 1
      if (attempts < 80) timer = window.setTimeout(align, 50)
    }

    align()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [pathname, hash])

  return null
}

const PortfolioPage = () => {
  // Coming back from /blog by client-side navigation, the document still carries
  // the article's tags - restore the home page's.
  useEffect(() => {
    setPageMeta()
  }, [])

  return (
    <main className="overflow-x-hidden w-full">
      <Home />
      <Suspense fallback={null}>
        <BelowTheFold />
      </Suspense>
    </main>
  )
}

// Holds the page height while a route chunk is in flight, so the footer does not
// flash at the top of the viewport and then jump away.
const RouteFallback = () => (
  <main className="min-h-screen bg-gray-50 dark:bg-dark-bg w-full" aria-busy="true" />
)

const RouteNotFound = () => {
  useEffect(() => {
    setPageMeta({ title: 'Page not found | Siva K' })
  }, [])

  return (
    <main className="section-padding pt-28 md:pt-32 bg-gray-50 dark:bg-dark-bg min-h-screen w-full">
      <div className="container-custom text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          That page does not exist. Try the portfolio or the articles instead.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            Portfolio
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-500 font-medium hover:bg-primary-500/20 transition-colors"
          >
            Articles
          </Link>
        </div>
      </div>
    </main>
  )
}

function App() {
  // Light mode temporarily disabled - dark mode only
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    // Force dark mode always (index.html already ships <html class="dark"> so the
    // first paint is dark; this keeps it so if anything toggles the class).
    document.documentElement.classList.add('dark')
    try {
      localStorage.setItem('theme', 'dark')
    } catch {
      // storage can be unavailable (private mode, blocked); nothing depends on it
    }
  }, [darkMode])

  // basename matches Vite's base so routes resolve under the GitHub Pages subpath
  return (
    <IconContext.Provider value={ICON_CONTEXT}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollManager />
        <div
          id="app-root"
          className={`min-h-screen transition-colors duration-300 overflow-x-hidden w-full ${
            darkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'
          }`}
        >
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<PortfolioPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="*" element={<RouteNotFound />} />
            </Routes>
          </Suspense>
          <Footer />
        </div>
      </BrowserRouter>
    </IconContext.Provider>
  )
}

export default App
