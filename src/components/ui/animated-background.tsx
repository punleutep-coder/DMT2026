'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AnimatedBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const currentMount = mountRef.current
    let isMobile = window.innerWidth < 768

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1)
    currentMount.appendChild(renderer.domElement)

    const particlesCount = isMobile ? 500 : 2000
    const positions = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15
    }

    const particlesGeometry = new THREE.BufferGeometry()
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x14a39a,
      size: 0.02,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      opacity: 0.5,
    })

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particleSystem)

    camera.position.z = 5

    const mouse = new THREE.Vector2()
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    if (!isMobile) {
        window.addEventListener('mousemove', handleMouseMove)
    }

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()

      particleSystem.rotation.y = elapsedTime * 0.05
      particleSystem.rotation.x = elapsedTime * 0.02

      if(!isMobile) {
        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02
      }
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      isMobile = window.innerWidth < 768
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      currentMount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-[#121823]"
    />
  )
}
