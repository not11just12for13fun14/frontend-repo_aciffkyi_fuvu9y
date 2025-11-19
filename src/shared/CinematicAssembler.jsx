import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'

/*
CinematicAssembler
- Plays a 10–12s assembly animation from an exploded view to a completed PC.
- Focuses on macro close-ups and satisfying snap motions.
- No UI, no text. Autoplays and loops (optional).

Expected mesh/group names in the GLB (case-insensitive match supported):
  case / chassis -> case_outer, side_glass
  motherboard    -> motherboard
  cpu            -> cpu
  cooler         -> cooler, heatsink, fans
  ram sticks     -> ram_1, ram_2 (A2/B2)
  gpu            -> gpu
  m.2 ssd        -> ssd
  psu            -> psu
  fans           -> fans_front, fan_rear
  cables         -> cables (optional)

Props:
- modelSrc: string (default '/models/pc_assembly.glb')
- duration: number seconds (default 11.5)
- loop: boolean (default true)
*/

export default function CinematicAssembler({ modelSrc = '/models/pc_assembly.glb', duration = 11.5, loop = true }){
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(new THREE.Scene())
  const cameraRef = useRef(null)
  const composerRef = useRef(null)
  const targetRef = useRef(new THREE.Object3D())
  const partsRef = useRef({})
  const tlRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  // Utility: find child by partial name (case-insensitive)
  const findByName = (root, names) => {
    const list = Array.isArray(names) ? names : [names]
    let found = null
    root.traverse((o)=>{
      if(found) return
      if(!o.name) return
      const nm = o.name.toLowerCase()
      if(list.some(n => nm.includes(String(n).toLowerCase()))) found = o
    })
    return found
  }

  useEffect(()=>{
    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const scene = sceneRef.current
    scene.background = new THREE.Color(0x04080f)
    scene.fog = new THREE.Fog(0x04080f, 8, 18)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(w,h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100)
    camera.position.set(2.8, 1.8, 3.6)
    cameraRef.current = camera

    // Lighting: dark studio with rim and soft fill, subtle internal RGB
    const hemi = new THREE.HemisphereLight(0x88c9ff, 0x0a0f15, 0.35)
    const key = new THREE.DirectionalLight(0xbddfff, 0.9)
    key.position.set(4, 6, 3)
    key.castShadow = true
    key.shadow.mapSize.set(1024,1024)
    const rim = new THREE.DirectionalLight(0x2ad2ff, 0.6)
    rim.position.set(-5, 3, -4)
    const fill = new THREE.PointLight(0x1a2a3a, 0.4, 10)
    fill.position.set(0.5, 0.6, 1)

    // Internal RGB accents
    const rgb1 = new THREE.PointLight(0x33ccff, 0.6, 2.2)
    rgb1.position.set(0.1, 0.6, 0.2)
    const rgb2 = new THREE.PointLight(0x7a5cff, 0.45, 2.0)
    rgb2.position.set(-0.3, 0.4, -0.1)
    const rgb3 = new THREE.PointLight(0x00ffbf, 0.35, 2.0)
    rgb3.position.set(0.2, 0.2, 0.5)

    scene.add(hemi, key, rim, fill, rgb1, rgb2, rgb3)

    // Ground for contact shadows
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 64),
      new THREE.ShadowMaterial({ opacity: 0.25 })
    )
    ground.rotation.x = -Math.PI/2
    ground.position.y = -0.9
    ground.receiveShadow = true
    scene.add(ground)

    // Slight volumetric beam fakes (transparent planes)
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x1677ff, transparent:true, opacity: 0.05, depthWrite:false })
    const beamGeo = new THREE.PlaneGeometry(6, 6)
    const beam1 = new THREE.Mesh(beamGeo, beamMat)
    beam1.rotation.x = -Math.PI/3
    beam1.position.set(-1.5, 1.5, -0.5)
    scene.add(beam1)

    // Add camera target
    scene.add(targetRef.current)

    // Load model
    const loader = new GLTFLoader()
    loader.load(modelSrc, (gltf)=>{
      const root = gltf.scene
      root.traverse(o=>{
        if(o.isMesh){
          o.castShadow = true
          o.receiveShadow = true
          if(o.material && 'metalness' in o.material){
            o.material.metalness = Math.min(1, (o.material.metalness ?? 0.5) + 0.1)
            o.material.roughness = Math.max(0, (o.material.roughness ?? 0.5) - 0.1)
          }
        }
      })

      // Wrap key parts to animate them as units
      const wrap = (child, name) => {
        if(!child) return null
        const g = new THREE.Group()
        g.name = name
        child.parent.add(g)
        g.add(child)
        g.position.copy(child.position)
        g.rotation.copy(child.rotation)
        g.scale.copy(child.scale)
        child.position.set(0,0,0)
        child.rotation.set(0,0,0)
        child.scale.set(1,1,1)
        partsRef.current[name] = g
        return g
      }

      // Map of expected names
      const mappings = {
        case_outer: ['case_outer','chassis','case','p400a','phanteks'],
        side_glass: ['side_glass','glass','panel'],
        motherboard: ['motherboard','b660','msi'],
        cpu: ['cpu','lga1700','13400f'],
        cooler: ['cooler','ak400','heatsink','fan_cooler'],
        ram_1: ['ram_1','ram_a2','ram1','ram-stick-1'],
        ram_2: ['ram_2','ram_b2','ram2','ram-stick-2'],
        gpu: ['gpu','graphics','4060','pci'],
        ssd: ['ssd','m2','nvme','p3'],
        psu: ['psu','power','focus','seasonic'],
        fans_front: ['fans_front','front_fans','fans'],
        fan_rear: ['fan_rear','rear_fan'],
        cables: ['cables','wires','harness']
      }

      // Find and wrap
      Object.entries(mappings).forEach(([key, list])=>{
        const node = findByName(root, list)
        if(node) wrap(node, key)
      })

      // Group fallback: if case outer not found, wrap whole root
      if(!partsRef.current.case_outer){
        const g = new THREE.Group()
        g.name = 'case_outer'
        g.add(root)
        partsRef.current.case_outer = g
        scene.add(g)
      } else {
        scene.add(root)
      }

      // Establish exploded start transforms (approximate offsets)
      const startOffsets = {
        side_glass: { p:[-0.15, 0.0, 0.55], r:[0, 0.25, 0] },
        motherboard:{ p:[0.18, 0.06, -0.35], r:[0, 0.08, 0.02] },
        cpu:         { p:[0.22, 0.22, -0.5], r:[0.2, 0.08, 0] },
        cooler:      { p:[0.22, 0.42, -0.6], r:[0.3, 0.2, 0.1] },
        ram_1:       { p:[0.42, 0.18, -0.18], r:[0.08, 0.2, 0] },
        ram_2:       { p:[0.5, 0.22, -0.1],  r:[0.08, 0.2, 0] },
        ssd:         { p:[0.55, 0.12, 0.1],  r:[0, 0.35, 0] },
        gpu:         { p:[-0.32, 0.2, -0.62], r:[0.05, -0.2, 0] },
        psu:         { p:[0, -0.35, 0.6],   r:[0, 0, 0.18] },
        fans_front:  { p:[0, 0.02, 0.75],  r:[0, 0, 0] },
        fan_rear:    { p:[0, 0.02, -0.7],  r:[0, 0, 0] },
        cables:      { p:[-0.35, 0.1, 0.45], r:[0, 0.25, 0] },
      }

      // Record assembled origins and set to exploded for start
      Object.entries(partsRef.current).forEach(([name, g])=>{
        g.userData.assembled = {
          p: g.position.clone(),
          r: g.rotation.clone(),
          s: g.scale.clone(),
        }
        const so = startOffsets[name]
        if(so){
          g.position.set(
            g.position.x + so.p[0],
            g.position.y + so.p[1],
            g.position.z + so.p[2],
          )
          g.rotation.set(
            g.rotation.x + so.r[0],
            g.rotation.y + so.r[1],
            g.rotation.z + so.r[2],
          )
        }
      })

      // Timeline
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
      const tTotal = duration
      const tStep = tTotal / 8

      // Helper: snap animation with tiny overshoot and scale punch
      const snapIn = (g, tStart, tLen = tStep*0.6) => {
        if(!g) return
        const A = g.userData.assembled
        tl.to(g.position, { x:A.p.x, y:A.p.y, z:A.p.z, duration: tLen }, tStart)
        tl.to(g.rotation, { x:A.r.x, y:A.r.y, z:A.r.z, duration: tLen }, tStart)
        tl.fromTo(g.scale, { x:1.0, y:1.0, z:1.0 }, { x:1.02, y:1.02, z:1.02, duration: tLen*0.35, yoyo:true, repeat:1, ease:'power1.out' }, tStart + tLen*0.65)
      }

      // Camera target and position keyframes
      const camKF = [
        { t: 0.0,  pos:[2.8,1.8,3.6],  look:[0.2,0.8,0.0] }, // establishing
        { t: 0.9,  pos:[0.9,1.1,1.2],  look:[0.1,0.7,-0.2] }, // CPU close-up
        { t: 2.2,  pos:[1.4,1.2,1.1],  look:[0.15,0.7,-0.15] }, // cooler
        { t: 3.6,  pos:[1.2,1.0,1.4],  look:[0.2,0.6,-0.2] }, // RAM
        { t: 4.9,  pos:[-1.3,1.0,1.2], look:[-0.1,0.7,-0.2] }, // GPU
        { t: 6.2,  pos:[0.8,0.9,1.8],  look:[0.1,0.4,0.2] }, // SSD
        { t: 7.5,  pos:[1.6,1.2,2.6],  look:[0.0,0.4,0.2] }, // PSU
        { t: 8.8,  pos:[2.0,1.6,3.0],  look:[0.0,0.7,0.0] }, // case close
        { t: 10.3, pos:[2.6,1.7,3.2],  look:[0.0,0.7,0.0] }, // hero
      ]

      camKF.forEach((k, i)=>{
        const t = Math.min(k.t, tTotal-0.2)
        tl.to(camera.position, { x:k.pos[0], y:k.pos[1], z:k.pos[2], duration: i? camKF[i].t - camKF[i-1].t : 0.9, ease:'power2.inOut' }, t)
        tl.to(targetRef.current.position, { x:k.look[0], y:k.look[1], z:k.look[2], duration: i? camKF[i].t - camKF[i-1].t : 0.9, ease:'power2.inOut' }, t)
      })

      // Sequence order + snaps
      let t0 = 0.6
      snapIn(partsRef.current.cpu,        t0);              t0 += tStep*0.5
      snapIn(partsRef.current.motherboard,t0);              t0 += tStep*0.5
      snapIn(partsRef.current.cooler,     t0);              t0 += tStep*0.5
      snapIn(partsRef.current.ram_1,      t0);              t0 += tStep*0.25
      snapIn(partsRef.current.ram_2,      t0);              t0 += tStep*0.35
      snapIn(partsRef.current.ssd,        t0);              t0 += tStep*0.45
      snapIn(partsRef.current.gpu,        t0);              t0 += tStep*0.6
      snapIn(partsRef.current.psu,        t0);              t0 += tStep*0.45
      snapIn(partsRef.current.cables,     t0, tStep*0.4);   t0 += tStep*0.2
      snapIn(partsRef.current.fans_front, t0, tStep*0.35);  t0 += tStep*0.2
      snapIn(partsRef.current.fan_rear,   t0, tStep*0.35);  t0 += tStep*0.2
      snapIn(partsRef.current.side_glass, t0, tStep*0.6)

      // Final slight orbit ease out
      tl.to(camera.position, { x:2.6, y:1.6, z:3.1, duration: 1.0 }, tTotal-1.0)

      tl.eventCallback('onComplete', ()=>{
        if(loop){
          gsap.delayedCall(1.0, ()=>{
            // Reset to exploded and replay
            Object.entries(partsRef.current).forEach(([name,g])=>{
              const A = g.userData.assembled
              g.position.set(A.p.x, A.p.y, A.p.z)
              g.rotation.set(A.r.x, A.r.y, A.r.z)
            })
            // Re-apply exploded offsets
            Object.entries(partsRef.current).forEach(([name,g])=>{
              const so = startOffsets[name]
              if(so){
                g.position.x += so.p[0]
                g.position.y += so.p[1]
                g.position.z += so.p[2]
                g.rotation.x += so.r[0]
                g.rotation.y += so.r[1]
                g.rotation.z += so.r[2]
              }
            })
            tl.restart()
          })
        }
      })

      tlRef.current = tl
      setReady(true)
      tl.play(0)
    }, (e)=>{
      setError('Model failed to load')
      console.error(e)
    })

    const onResize = ()=>{
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w,h)
      camera.aspect = w/h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    let stopped = false
    const onVisibility = (e) => { stopped = e.detail.hidden }
    window.addEventListener('tab-visibility', onVisibility)

    const clock = new THREE.Clock()
    function animate(){
      const r = rendererRef.current
      if(!r) return
      requestAnimationFrame(animate)
      if(stopped) return
      // Make camera look at target each frame
      if(cameraRef.current && targetRef.current){
        cameraRef.current.lookAt(targetRef.current.position)
      }
      r.render(scene, camera)
    }
    animate()

    return ()=>{
      window.removeEventListener('resize', onResize)
      window.removeEventListener('tab-visibility', onVisibility)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [modelSrc, duration, loop])

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black">
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">Loading 3D scene…</div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">
          Unable to load model. Ensure '/models/pc_assembly.glb' exists with expected part names.
        </div>
      )}
    </div>
  )
}
