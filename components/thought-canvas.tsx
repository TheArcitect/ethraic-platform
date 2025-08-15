'use client'

import { useEffect, useRef } from 'react'

export default function ThoughtCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<any[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize particles
    for (let i = 0; i < 100; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1
      })
    }

    const animate = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 100, 100, ${particle.alpha})`
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Expose createThoughtCluster to window
    if (typeof window !== 'undefined') {
      (window as any).createThoughtCluster = (x: number, y: number, intensity: number) => {
        for (let i = 0; i < 20 * intensity; i++) {
          particles.current.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5 * intensity,
            vy: (Math.random() - 0.5) * 5 * intensity,
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.8 + 0.2
          })
        }
        
        // Remove oldest particles if too many
        if (particles.current.length > 500) {
          particles.current = particles.current.slice(-500)
        }
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (typeof window !== 'undefined') {
        delete (window as any).createThoughtCluster
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  )
}