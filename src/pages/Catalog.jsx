import { useEffect, useMemo, useState } from 'react'
import productsData from '../../public/products.json'
import { Link, useLocation } from 'react-router-dom'

export default function Catalog(){
  const q = new URLSearchParams(useLocation().search)
  const tag = q.get('tag')
  const [filters, setFilters] = useState({ cpu:'', gpu:'', ram:'', ssd:'', min:'', max:'' })
  const products = useMemo(()=> productsData.items.filter(p => !tag || p.tags.includes(tag)), [tag])

  const filtered = useMemo(()=> products.filter(p => {
    if(filters.cpu && !p.cpu.toLowerCase().includes(filters.cpu.toLowerCase())) return false
    if(filters.gpu && !p.gpu.toLowerCase().includes(filters.gpu.toLowerCase())) return false
    if(filters.ram && !p.ram.toLowerCase().includes(filters.ram.toLowerCase())) return false
    if(filters.ssd && !p.ssd.toLowerCase().includes(filters.ssd.toLowerCase())) return false
    if(filters.min && p.price < Number(filters.min)) return false
    if(filters.max && p.price > Number(filters.max)) return false
    return true
  }), [products, filters])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Catalog</h1>
      <div className="mt-6 grid md:grid-cols-[260px,1fr] gap-6">
        <aside className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="grid gap-3">
            {['cpu','gpu','ram','ssd'].map(key => (
              <label key={key} className="grid gap-1">
                <span className="text-xs text-slate-400 uppercase">{key.toUpperCase()}</span>
                <input value={filters[key]} onChange={e=> setFilters(v=>({...v,[key]:e.target.value}))} placeholder={`Search ${key}`} className="px-3 py-2 rounded bg-slate-900 border border-white/10"/>
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <input value={filters.min} onChange={e=> setFilters(v=>({...v,min:e.target.value}))} placeholder="Min $" className="px-3 py-2 rounded bg-slate-900 border border-white/10"/>
              <input value={filters.max} onChange={e=> setFilters(v=>({...v,max:e.target.value}))} placeholder="Max $" className="px-3 py-2 rounded bg-slate-900 border border-white/10"/>
            </div>
          </div>
        </aside>
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <Link to={`/product/${p.id}`} key={p.id} className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-400/30">
              <img src={p.images[0]} alt={p.name} className="w-full h-44 object-cover" loading="lazy"/>
              <div className="p-4">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-400">{p.cpu} · {p.gpu} · {p.ram} RAM · {p.ssd} SSD</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-cyan-300 font-bold">${p.price.toLocaleString()}</div>
                  <button className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">Buy</button>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}
