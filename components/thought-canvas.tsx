'use client'

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    createThoughtCluster?: (x: number, y: number, intensity: number) => void;
  }
}

const ThoughtCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class ThoughtNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      radius: number;
      connections: any[];
      pulsePhase: number;

      constructor(x: number, y: number, life = 1) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.life = life;
        this.maxLife = life;
        this.radius = Math.random() * 2 + 1;
        this.connections = [];
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.002;
        this.pulsePhase += 0.02;
        
        if (this.x < 50 || this.x > canvas.width - 50) {
          this.vx *= -0.8;
          this.x = Math.max(50, Math.min(canvas.width - 50, this.x));
        }
        if (this.y < 50 || this.y > canvas.height - 50) {
          this.vy *= -0.8;
          this.y = Math.max(50, Math.min(canvas.height - 50, this.y));
        }
        
        this.vx *= 0.999;
        this.vy *= 0.999;
      }

      draw() {
        const opacity = Math.max(0, Math.min(1, this.life)) * 0.8;
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.fill();
      }
    }

    class Connection {
      node1: ThoughtNode;
      node2: ThoughtNode;
      strength: number;
      targetStrength: number;
      pulsePhase: number;

      constructor(node1: ThoughtNode, node2: ThoughtNode) {
        this.node1 = node1;
        this.node2 = node2;
        this.strength = 0;
        this.targetStrength = Math.random() * 0.5 + 0.2;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.strength += (this.targetStrength - this.strength) * 0.05;
        this.pulsePhase += 0.03;
        
        if (Math.random() < 0.01) {
          this.targetStrength = Math.random() * 0.5 + 0.2;
        }
      }

      draw() {
        const dist = Math.hypot(this.node2.x - this.node1.x, this.node2.y - this.node1.y);
        const maxDist = 200;
        
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * this.strength * 
                        Math.min(this.node1.life, this.node2.life) *
                        (Math.sin(this.pulsePhase) * 0.2 + 0.8);
          
          ctx.beginPath();
          ctx.moveTo(this.node1.x, this.node1.y);
          
          const midX = (this.node1.x + this.node2.x) / 2 + Math.sin(this.pulsePhase) * 10;
          const midY = (this.node1.y + this.node2.y) / 2 + Math.cos(this.pulsePhase) * 10;
          
          ctx.quadraticCurveTo(midX, midY, this.node2.x, this.node2.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    let thoughts: ThoughtNode[] = [];
    let connections: Connection[] = [];

    function createThoughtCluster(x: number, y: number, intensity = 1) {
      const count = Math.floor(3 + intensity * 5);
      const newThoughts: ThoughtNode[] = [];
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const radius = 20 + Math.random() * 50 * intensity;
        const nx = x + Math.cos(angle) * radius;
        const ny = y + Math.sin(angle) * radius;
        const node = new ThoughtNode(nx, ny, 1 + Math.random());
        thoughts.push(node);
        newThoughts.push(node);
      }
      
      for (let i = 0; i < newThoughts.length; i++) {
        for (let j = i + 1; j < newThoughts.length; j++) {
          if (Math.random() < 0.3) {
            connections.push(new Connection(newThoughts[i], newThoughts[j]));
          }
        }
      }
      
      for (let newNode of newThoughts) {
        for (let existingNode of thoughts) {
          if (!newThoughts.includes(existingNode) && Math.random() < 0.1) {
            connections.push(new Connection(newNode, existingNode));
          }
        }
      }
    }

    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      connections = connections.filter(conn => 
        conn.node1.life > 0 && conn.node2.life > 0
      );
      
      connections.forEach(conn => {
        conn.update();
        conn.draw();
      });
      
      thoughts = thoughts.filter(thought => thought.life > 0);
      
      thoughts.forEach(thought => {
        thought.update();
        thought.draw();
      });
      
      requestAnimationFrame(animate);
    }

    const ambientInterval = setInterval(() => {
      if (thoughts.length < 30 && Math.random() < 0.3) {
        createThoughtCluster(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 0.3
        );
      }
    }, 2000);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    animate();

    setTimeout(() => {
      createThoughtCluster(canvas.width * 0.3, canvas.height * 0.4, 0.5);
    }, 500);

    window.createThoughtCluster = createThoughtCluster;

    return () => {
      clearInterval(ambientInterval);
      window.removeEventListener('resize', handleResize);
      delete window.createThoughtCluster;
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};

export default ThoughtCanvas;