import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion } from 'framer-motion'
import ExplodedPc from '../shared/ExplodedPc'

export default function Home(){
  const [webgl, setWebgl] = useState(true)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if(!gl) setWebgl(false)
    } catch(e){ setWebgl(false) }
  }, [])

  return (
    <div>
      <section className="relative min-h-[80vh] grid place-items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center pt-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 text-transparent bg-clip-text">Power your play</h1>
            <p className="mt-4 text-slate-300 max-w-prose">NeonRig builds performance PCs with premium parts, clean cable work, and quiet cooling. Hover or tap the system to explore how each component fits together.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#catalog" className="px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20">Shop catalog</a>
              <a href="#faq" className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Learn more</a>
            </div>
          </div>
          <div className="relative h-[420px] md:h-[520px]">
            <div className="absolute inset-0 rounded-[24px] border border-cyan-500/20 bg-white/5 backdrop-blur-sm"/>
            <div className="relative h-full w-full rounded-[24px] overflow-hidden pc-hero">
              {webgl ? (
                <ExplodedPc modelSrc="/models/pc.glb" intensity={1} />
              ) : (
                <FallbackExploded />
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"/>
        <div className="absolute inset-0 -z-0">
          <Spline scene="https://prod.spline.design/fcD-iW8YZHyBp1qq/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
      </section>

      <Advantages />
      <Selections />
      <Reviews />
      <FAQ />
      <CTA />
    </div>
  )
}

function Advantages(){
  const items = [
    {title:'Quiet & cool', text:'Optimized airflow with premium fans and tuned curves.'},
    {title:'Pro assembly', text:'Clean cable routing, BIOS tuning, stress-tested 24 hours.'},
    {title:'Fast delivery', text:'Ships in 3–5 days with safe packaging and tracking.'},
    {title:'2-year warranty', text:'Full parts and labor coverage. Extended care available.'},
  ]
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((i)=> (
          <div key={i.title} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-cyan-400/30 transition">
            <div className="text-cyan-300 font-semibold">{i.title}</div>
            <p className="text-slate-400 mt-2 text-sm">{i.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Selections(){
  const items = [
    {title:'Gaming', tag:'gaming', text:'High FPS rigs for esports and AAA titles.'},
    {title:'Creativity', tag:'creativity', text:'Workstations for 3D, video, and rendering.'},
    {title:'Office', tag:'office', text:'Silent, reliable desktops for everyday work.'},
  ]
  return (
    <section className="py-16" id="catalog">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold">Curated selections</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {items.map((i)=> (
            <a key={i.tag} href={`/catalog?tag=${i.tag}`} className="group rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 hover:border-cyan-400/30">
              <div className="h-40 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.2),transparent_60%)]"/>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{i.title}</div>
                  <p className="text-sm text-slate-400">{i.text}</p>
                </div>
                <span className="text-cyan-300 opacity-0 group-hover:opacity-100 transition">Shop →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Reviews(){
  const items = [
    {name:'Alex M.', text:'Hit 240 FPS in Valorant out of the box. Build quality is insane.'},
    {name:'Priya N.', text:'My Premiere exports are 3× faster than before. Whisper quiet.'},
    {name:'Leo K.', text:'Support helped tune XMP and fan curves. Flawless experience.'},
  ]
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold">What players say</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {items.map((i)=> (
            <div key={i.name} className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <p className="text-slate-300">“{i.text}”</p>
              <div className="mt-4 text-sm text-slate-400">{i.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ(){
  const items = [
    {q:'How fast do you ship?', a:'Most orders ship within 3–5 business days after stress testing.'},
    {q:'Do you overclock?', a:'We apply safe, manufacturer-approved profiles and XMP.'},
    {q:'Which games can I run?', a:'Check product pages for FPS estimates across popular titles.'},
  ]
  return (
    <section id="faq" className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
          {items.map((i)=> (
            <details key={i.q} className="group bg-white/5">
              <summary className="list-none cursor-pointer p-5 font-medium group-open:bg-white/5">{i.q}</summary>
              <div className="p-5 text-slate-300">{i.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA(){
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-extrabold">Ready to build your advantage?</h2>
        <p className="text-slate-300 mt-2">Pick a configuration or start from a base and customize every part.</p>
        <a href="/catalog" className="inline-flex mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold hover:brightness-110">Buy / Configure</a>
      </div>
    </section>
  )
}

function FallbackExploded(){
  return (
    <div className="relative h-full w-full grid place-items-center">
      <img src="/fallback/pc-layers.png" alt="PC exploded view" className="w-full max-w-md opacity-90"/>
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_60%)]"/>
    </div>
  )
}
