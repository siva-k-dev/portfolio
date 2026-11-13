import { lazy, Suspense, useEffect, useState } from 'react'

// Three.js, fiber, drei and the model are only ever reached through this import,
// so none of them are in the initial bundle.
const ComputersCanvas = lazy(() => import('./canvas/Computers'))

const DESKTOP = '(min-width: 640px)' // the sm: breakpoint at which Home shows the model
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// Anything a person does on the page. The first of these brings the model in.
const INTERACTIONS = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel']
const FALLBACK_MS = 10000 // for a visitor who only reads: the model still arrives

// The hero copy is what a visitor (and Lighthouse's LCP / blocking time) waits
// for; the model is decoration. So it never loads on phones (the layout hides
// it there anyway, but it would still download), never for readers who asked
// for reduced motion or data saving, and otherwise waits for the first
// interaction - which on a desktop is the first mouse move, almost at once -
// rather than paying ~250 KB of JavaScript and a 1.4 MB model up front.
const allowed = () => {
  if (!window.matchMedia(DESKTOP).matches) return false
  if (window.matchMedia(REDUCED_MOTION).matches) return false
  const connection = navigator.connection
  if (connection && (connection.saveData || /^(slow-)?2g$/.test(connection.effectiveType || ''))) {
    return false
  }
  return true
}

const HeroModel = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return undefined

    const media = window.matchMedia(DESKTOP)
    let timer = null

    const stop = () => {
      INTERACTIONS.forEach((name) => window.removeEventListener(name, onInteraction, true))
      media.removeEventListener('change', onInteraction)
      if (timer !== null) window.clearTimeout(timer)
    }

    // Also re-checked on breakpoint changes, so widening a narrow window counts.
    function onInteraction() {
      if (!allowed()) return
      stop()
      setReady(true)
    }

    INTERACTIONS.forEach((name) =>
      window.addEventListener(name, onInteraction, { capture: true, passive: true }),
    )
    media.addEventListener('change', onInteraction)
    timer = window.setTimeout(onInteraction, FALLBACK_MS)

    return stop
  }, [ready])

  if (!ready) return null

  return (
    <Suspense fallback={null}>
      <ComputersCanvas />
    </Suspense>
  )
}

export default HeroModel
