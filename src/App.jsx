import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Product from './pages/Product'
import Policy from './pages/Policy'
import Cinematic from './pages/Cinematic'
import './index.css'

function App() {
  useEffect(() => {
    const handler = () => {
      const isHidden = document.hidden
      const event = new CustomEvent('tab-visibility', { detail: { hidden: isHidden } })
      window.dispatchEvent(event)
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 bg-slate-950/80 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
          <Link to="/" className="font-bold text-xl tracking-tight text-cyan-300">NeonRig</Link>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link className="hover:text-cyan-300 transition" to="/catalog">Catalog</Link>
            <Link className="hover:text-cyan-300 transition" to="/policy">Delivery & Payment</Link>
            <Link className="hover:text-cyan-300 transition" to="/cinematic">Cinematic</Link>
            <a className="hover:text-cyan-300 transition" href="#contact">Contacts</a>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/catalog" element={<Catalog/>} />
          <Route path="/product/:id" element={<Product/>} />
          <Route path="/policy" element={<Policy/>} />
          <Route path="/cinematic" element={<Cinematic/>} />
        </Routes>
      </main>

      <footer className="mt-16 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-semibold text-cyan-300 mb-2">NeonRig</div>
            <p className="text-slate-400">Custom gaming PCs engineered for victory. Built, tested, and delivered fast.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Catalog</div>
            <ul className="space-y-1 text-slate-400">
              <li><Link className="hover:text-cyan-300" to="/catalog?tag=gaming">Gaming</Link></li>
              <li><Link className="hover:text-cyan-300" to="/catalog?tag=creativity">Creativity</Link></li>
              <li><Link className="hover:text-cyan-300" to="/catalog?tag=office">Office</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-1 text-slate-400">
              <li><Link className="hover:text-cyan-300" to="/policy">Delivery & Payment</Link></li>
              <li><a className="hover:text-cyan-300" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div id="contact">
            <div className="font-semibold mb-2">Contacts</div>
            <p className="text-slate-400">support@neonrig.store<br/>+1 (415) 555‑0149</p>
            <div className="flex gap-3 mt-3">
              <a aria-label="Twitter" className="hover:text-cyan-300" href="#">Twitter</a>
              <a aria-label="Instagram" className="hover:text-cyan-300" href="#">Instagram</a>
              <a aria-label="YouTube" className="hover:text-cyan-300" href="#">YouTube</a>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 pb-8">© {new Date().getFullYear()} NeonRig</div>
      </footer>
    </div>
  )
}

export default App
