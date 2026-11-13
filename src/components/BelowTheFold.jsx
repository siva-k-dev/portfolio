import About from './About'
import Skills from './Skills'
import Projects from './Projects'
import GithubStats from './GithubStats'
import Experience from './Experience'
import Education from './Education'
import LatestArticles from './LatestArticles'
import Contact from './Contact'

// Everything under the hero, as one lazy chunk (see App.jsx) that is requested
// as soon as the app mounts, so section links keep working; it just no longer
// sits between the visitor and the first paint.
//
// Deliberately mounted in a single pass. Mounting one section per idle period
// was tried and measured worse: every step's commit forced a full-page style
// and layout pass (~300 ms on a throttled phone), so eight steps cost eight
// layouts instead of one and mobile blocking time went from 0.4 s to 3 s.
const BelowTheFold = () => (
  <>
    <About />
    <Skills />
    <Projects />
    <GithubStats />
    <Experience />
    <Education />
    <LatestArticles />
    <Contact />
  </>
)

export default BelowTheFold
