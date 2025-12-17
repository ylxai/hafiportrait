'use client'

import { useEffect, useRef, useState } from 'react'

interface TabContentProps {
  is_active: boolean
  children: React.ReactNode
  preload?: boolean
  className?: string
}

export default function TabContent({ 
  is_active, 
  children, 
  preload = false, 
  className = '' 
}: TabContentProps) {
  const [hasLoaded, setHasLoaded] = useState(is_active)
  const [isVisible, setIsVisible] = useState(is_active)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (is_active && !hasLoaded) {
      setHasLoaded(true)
    }
    
    if (is_active) {
      // Use requestAnimationFrame untuk smooth transition
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
    }
  }, [is_active, hasLoaded])

  // Preload content jika diperlukan
  const shouldRender = hasLoaded || preload || is_active

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className={`
        transition-all duration-150 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'}
        ${!is_active ? 'pointer-events-none absolute inset-0' : 'relative'}
        ${className}
      `}
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(4px)',
      }}
    >
      {children}
    </div>
  )
}
