import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

/*
Reusable ExplodedPc component
Props: 
- modelSrc: string
- offsets: optional mapping of meshName => { position: [x,y,z], rotation: [x,y,z] }
- intensity: number (multiplier for offsets)
- onPartHover(name), onPartClick(name)
Accessibility: focuses hotspots with Tab; toggle button to explore/assemble
*/

export default function ExplodedPc({ modelSrc = '/models/pc.glb', offsets = {}, intensity = 1, onPartHover, onPartClick }){
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(new THREE.Scene())
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const mixersRef = useRef([])
  const [ready, setReady] = useState(false)
  const [exploded, setExploded] = useState(false)
  const raycaster = useMemo(()=> new THREE.Raycaster(), [])
  const mouse = useMemo(()=> new THREE.Vector2(), [])
  const partsRef = useRef({})
  const tlRef = useRef(null)

  useEffect(()=>{
    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w,h)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = sceneRef.current
    scene.background = null

    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100)
    camera.position.set(2.6, 1.6, 3.2)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 6
    controlsRef.current = controls

    const ambient = new THREE.AmbientLight(0xaad8ff, 0.6)
    const dir = new THREE.DirectionalLight(0x88ccff, 0.9)
    dir.position.set(5,6,4)
    dir.castShadow = true
    scene.add(ambient, dir)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3,64),
      new THREE.ShadowMaterial({ opacity: 0.25 })
    )
    floor.receiveShadow = true
    floor.rotation.x = -Math.PI/2
    floor.position.y = -0.9
    scene.add(floor)

    let stopped = false

    const loader = new GLTFLoader()
    loader.load(modelSrc, (gltf)=>{
      const root = gltf.scene
      root.traverse(obj=>{
        if(obj.isMesh){
          obj.castShadow = true
          obj.receiveShadow = true
        }
      })

      const names = ['case_outer','side_glass','motherboard','cpu','cooler','ram_1','ram_2','gpu','ssd','psu','fans_front','fan_rear','cables']
      const group = new THREE.Group()
      names.forEach(n=>{
        const child = root.getObjectByName(n)
        if(child){
          const wrapper = new THREE.Group()
          wrapper.name = n
          wrapper.add(child)
          group.add(wrapper)
          partsRef.current[n] = wrapper
          wrapper.userData.origin = {
            position: wrapper.position.clone(),
            rotation: wrapper.rotation.clone()
          }
        }
      })
      scene.add(group)

      // GSAP timeline for explode/assemble
      const tl = gsap.timeline({ paused: true, defaults: { duration: 1.2, ease: 'power2.out' } })
      const def = {
        case_outer: { position: [0,0,0.28], rotation:[0,0,0] },
        side_glass: { position: [-0.1,0,0.5], rotation:[0,0.2,0] },
        motherboard: { position: [0.15,0.05,-0.35], rotation:[0,0.1,0] },
        cpu: { position: [0.2,0.2,-0.5], rotation:[0.2,0.1,0] },
        cooler: { position: [0.2,0.4,-0.6], rotation:[0.3,0.2,0.1] },
        ram_1: { position: [0.4,0.2,-0.2], rotation:[0.1,0.2,0] },
        ram_2: { position: [0.5,0.25,-0.1], rotation:[0.1,0.2,0] },
        gpu: { position: [-0.3,0.15,-0.6], rotation:[0.05,-0.2,0] },
        ssd: { position: [0.6,0.1,0.1], rotation:[0,0.4,0] },
        psu: { position: [0,-0.4,0.6], rotation:[0,0,0.2] },
        fans_front: { position: [0,0,0.8], rotation:[0,0,0] },
        fan_rear: { position: [0,0,-0.7], rotation:[0,0,0] },
        cables: { position: [-0.4,0.1,0.5], rotation:[0,0.3,0] },
      }

      Object.entries(partsRef.current).forEach(([name, wrapper])=>{
        const off = offsets[name] || def[name] || { position:[0,0,0], rotation:[0,0,0] }
        const p = off.position.map(v=> v*intensity)
        const r = off.rotation.map(v=> v*intensity)
        tl.to(wrapper.position, { x: p[0], y: p[1], z: p[2] }, 0)
        tl.to(wrapper.rotation, { x: r[0], y: r[1], z: r[2] }, 0)
      })

      tlRef.current = tl
      setReady(true)
    })

    const onResize = () => {
      if(!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      rendererRef.current.setSize(w,h)
      cameraRef.current.aspect = w/h
      cameraRef.current.updateProjectionMatrix()
    }
    const onVisibility = (e) => { stopped = e.detail.hidden }

    window.addEventListener('tab-visibility', onVisibility)
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    function animate(){
      const r = rendererRef.current
      if(!r) return
      requestAnimationFrame(animate)
      if(stopped) return
      controls.update()
      r.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('tab-visibility', onVisibility)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [modelSrc, intensity, offsets])

  useEffect(()=>{
    const el = containerRef.current
    if(!el) return

    let entered = false
    const enter = ()=> { entered = true; setExploded(true); tlRef.current && tlRef.current.play() }
    const leave = ()=> { entered = false; setExploded(false); tlRef.current && tlRef.current.reverse() }

    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('click', ()=> { if(exploded) leave(); else enter() })

    return ()=> {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [exploded])

  // Hotspots and hover highlighting
  useEffect(()=>{
    const el = containerRef.current
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const scene = sceneRef.current
    if(!el || !renderer || !camera) return

    const glowMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x0d2333, emissiveIntensity: 0.6, transparent:true, opacity:0.3 })
    let current = null

    const move = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ( (e.clientX - rect.left) / rect.width ) * 2 - 1
      const y = - ( (e.clientY - rect.top) / rect.height ) * 2 + 1
      mouse.set(x, y)
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(Object.values(partsRef.current), true)
      if(intersects.length){
        const obj = intersects[0].object
        const root = Object.values(partsRef.current).find(g => g === obj || g.children.includes(obj))
        if(root && current !== root){
          if(current){ restore(current) }
          current = root
          highlight(root)
          onPartHover && onPartHover(root.name)
        }
      } else if(current){
        restore(current)
        current = null
        onPartHover && onPartHover(null)
      }
    }

    const click = () => { if(current) onPartClick && onPartClick(current.name) }

    renderer.domElement.addEventListener('mousemove', move)
    renderer.domElement.addEventListener('mouseleave', ()=>{ if(current){ restore(current); current=null } })
    renderer.domElement.addEventListener('click', click)

    function highlight(group){
      group.traverse(child => {
        if(child.isMesh){
          child.userData._orig = child.material
          child.material = glowMat
        }
      })
    }
    function restore(group){
      group.traverse(child => {
        if(child.isMesh && child.userData._orig){ child.material = child.userData._orig; delete child.userData._orig }
      })
    }

    return ()=>{
      renderer.domElement.removeEventListener('mousemove', move)
    }
  }, [onPartHover, onPartClick])

  return (
    <div ref={containerRef} className="h-full w-full relative outline-none" role="application" aria-label="Interactive PC exploded view">
      <button aria-pressed={exploded} className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-200" onClick={()=>{ const t = !exploded; setExploded(t); tlRef.current && (t? tlRef.current.play() : tlRef.current.reverse()) }}>{exploded? 'Assemble' : 'Explore'}</button>
      {/* Tooltip container handled in parent if needed */}
    </div>
  )
}
