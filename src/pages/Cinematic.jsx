import CinematicAssembler from '../shared/CinematicAssembler'

export default function Cinematic(){
  return (
    <div className="min-h-[70vh]">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
          <CinematicAssembler modelSrc="/models/pc_assembly.glb" duration={11.5} loop={true} />
        </div>
        <p className="sr-only">Cinematic 3D assembly animation of a desktop PC from exploded view to complete build.</p>
      </section>
    </div>
  )
}
