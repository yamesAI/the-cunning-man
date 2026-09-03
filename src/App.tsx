import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import { SiteLayout, inIframe } from './components/SiteLayout'
import SiteHome from './pages/site/SiteHome'
import SynastryPage from './pages/site/SynastryPage'
import LaunchesPage from './pages/site/LaunchesPage'
import SigilPage from './pages/site/SigilPage'
import RunesPage from './pages/site/RunesPage'
import SpellPage from './pages/site/SpellPage'
import PressIndex from './pages/site/PressIndex'
import PressRelease from './pages/site/PressRelease'

export default function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<SiteHome />} />
        <Route path="/clock" element={<Home />} />
        <Route path="/synastry" element={<SynastryPage />} />
        <Route path="/launches" element={<LaunchesPage />} />
        <Route path="/sigil" element={<SigilPage />} />
        <Route path="/runes" element={<RunesPage />} />
        <Route path="/spells/love" element={<SpellPage kind="love" />} />
        <Route path="/spells/money" element={<SpellPage kind="money" />} />
        <Route path="/press" element={<PressIndex />} />
        <Route path="/press/:slug" element={<PressRelease />} />
        <Route path="*" element={inIframe ? <Home /> : <SiteHome />} />
      </Routes>
    </SiteLayout>
  )
}
