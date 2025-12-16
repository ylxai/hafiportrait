'use client'

import { useEffect, useRef, useState } from 'react'

interface TabContentProps {
  isActive: boolean
  children: React.ReactNode
  preload?: boolean
  className?: string
}

export default function TabContent({ 
  isActive, 
  children, 
  preload = false, 
  className = '' 
}: TabContentProps) {
  const [hasLoaded, setHasLoaded] = useState(isActive)
  const [isVisible, setIsVisible] = useState(isActive)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && !hasLoaded) {
      setHasLoaded(true)
    }
    
    if (isActive) {
      // Use requestAnimationFrame untuk smooth transition
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
    }
  }, [isActive, hasLoaded])

  // Preload content jika diperlukan
  const shouldRender = hasLoaded || preload || isActive

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className={`
        transition-all duration-150 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'}
        ${!isActive ? 'pointer-events-none absolute inset-0' : 'relative'}
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
