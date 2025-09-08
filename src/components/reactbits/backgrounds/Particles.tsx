import React, { useEffect, useRef } from 'react';

interface ParticlesProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
  className?: string;
}

const defaultColors: string[] = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const Particles: React.FC<ParticlesProps> = ({
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleColors,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 2,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    container.appendChild(canvas);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize, false);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
    };

    if (moveParticlesOnHover) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    // Create particles
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      color: string;
      size: number;
    }> = [];

    const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * particleSpread,
        y: (Math.random() - 0.5) * particleSpread,
        z: (Math.random() - 0.5) * particleSpread,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        vz: (Math.random() - 0.5) * speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: particleBaseSize * (1 + sizeRandomness * (Math.random() - 0.5))
      });
    }

    let animationFrameId: number;
    let time = 0;

    const update = () => {
      animationFrameId = requestAnimationFrame(update);
      time += 0.016;

      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Wrap around
        if (particle.x > particleSpread / 2) particle.x = -particleSpread / 2;
        if (particle.x < -particleSpread / 2) particle.x = particleSpread / 2;
        if (particle.y > particleSpread / 2) particle.y = -particleSpread / 2;
        if (particle.y < -particleSpread / 2) particle.y = particleSpread / 2;

        // Project to 2D
        const scale = cameraDistance / (cameraDistance + particle.z);
        const x2d = (particle.x * scale + canvas.width / 2);
        const y2d = (particle.y * scale + canvas.height / 2);

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alphaParticles ? 0.6 : 1;
        ctx.beginPath();
        ctx.arc(x2d, y2d, particle.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [
    particleCount,
    particleSpread,
    speed,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation
  ]);

  return <div ref={containerRef} className={`relative w-full h-full ${className}`} />;
};

export default Particles;