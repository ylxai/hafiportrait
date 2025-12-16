'use client'

import { useState, useEffect, useRef } from 'react'

interface TouchGesture {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
}

export function useTouchGestures(threshold: number = 50) {
  const [gesture, setGesture] = useState<TouchGesture>({ direction: null, distance: 0 })
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }

      const deltaX = touchEnd.x - touchStartRef.current.x
      const deltaY = touchEnd.y - touchStartRef.current.y

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > threshold || absDeltaY > threshold) {
        if (absDeltaX > absDeltaY) {
          setGesture({
            direction: deltaX > 0 ? 'right' : 'left',
            distance: absDeltaX
          })
        } else {
          setGesture({
            direction: deltaY > 0 ? 'down' : 'up',
            distance: absDeltaY
          })
        }
      }

      touchStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [threshold])

  return gesture
}
