'use client'

import { useEffect, useRef } from 'react'

export default function ThoughtCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<any[]>([])
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      opacity: number
      fadeSpeed: number
      pulsePhase: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 0.5
        this.opacity = Math.random() * 0.5 + 0.1
        this.fadeSpeed = Math.random() * 0.01 + 0.005
        this.pulsePhase = Math.random() * Math.PI * 2
        this.color = `rgba(255, 255, 255, ${this.opacity})`
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulsePhase += 0.05
        
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8
        this.opacity = Math.min(0.6, Math.max(0.1, this.opacity * pulse))
        
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1
        
        const dx = mouseRef.current.x - this.x
        const dy = mouseRef.current.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100) {
          const force = (100 - distance) / 100
          this.vx += (dx / distance) * force * 0.05
          this.vy += (dy / distance) * force * 0.05
        }
        
        this.vx *= 0.99
        this.vy *= 0.99
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      particlesRef.current.forEach(particle => {
        particle.update()
        particle.draw()
      })
      
      // Draw connections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 0.5
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x
          const dy = particlesRef.current[i].y - particlesRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y)
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y)
            ctx.globalAlpha = (150 - distance) / 150 * 0.2
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Safely add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('resize', handleResize)
      
      // Global function for thought triggers - safely add to window
      if (typeof window !== 'undefined') {
        (window as any).createThoughtCluster = (x: number, y: number, intensity: number) => {
          for (let i = 0; i < 10 * intensity; i++) {
            const particle = new Particle()
            particle.x = x
            particle.y = y
            particle.vx = (Math.random() - 0.5) * 5 * intensity
            particle.vy = (Math.random() - 0.5) * 5 * intensity
            particle.opacity = 0.8
            particlesRef.current.push(particle)
          }
          
          // Limit particles
          if (particlesRef.current.length > 200) {
            particlesRef.current = particlesRef.current.slice(-200)
          }
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('resize', handleResize)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: 'black' }}
    />
  )
}