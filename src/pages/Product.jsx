import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import productsData from '../../public/products.json'

export default function Product(){
  const { id } = useParams()
  const product = useMemo(()=> productsData.items.find(p=> String(p.id)===String(id)), [id])
  if(!product) return <div className="max-w-5xl mx-auto px-4 py-10">Not found</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <Gallery images={product.images} name={product.name} />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="mt-2 text-slate-400">{product.cpu} · {product.gpu} · {product.ram} RAM · {product.ssd} SSD</div>
          <div className="mt-4 text-3xl font-extrabold text-cyan-300">${product.price.toLocaleString()}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 font-semibold">Buy</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">Add to assembly</button>
          </div>
          <div className="mt-6">
            <h2 className="font-semibold">Benchmarks</h2>
            <ul className="text-slate-400 text-sm mt-2 list-disc pl-5">
              {product.benchmarks.map((b)=> (
                <li key={b.game}>{b.game}: {b.fps} FPS (1080p High)</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 grid gap-2 text-sm text-slate-300">
            <div>Warranty: 2 years parts and labor</div>
            <div>Installment: from $/mo with approved credit</div>
            <div>Returns: 30 days, no restocking fee</div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold">Similar products</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.items.filter(p=> p.id!==product.id && (p.tags.some(t=> product.tags.includes(t)))).slice(0,3).map(p=> (
            <Link to={`/product/${p.id}`} key={p.id} className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-400/30">
              <img src={p.images[0]} alt={p.name} className="w-full h-40 object-cover"/>
              <div className="p-4">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-400">{p.cpu} · {p.gpu}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Gallery({ images, name }){
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
      <img src={images[0]} alt={name} className="w-full h-80 object-cover"/>
      <div className="grid grid-cols-4 gap-2 p-2 bg-slate-900/50">
        {images.slice(1,5).map((src, i)=> (
          <img key={i} src={src} alt={`${name} ${i+2}`} className="h-20 w-full object-cover rounded"/>
        ))}
      </div>
    </div>
  )
}
