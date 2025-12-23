'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon, 
  Squares2X2Icon, 
  PlayIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline'

interface FloatingMenuProps {
  onHome: () => void
  onGridView: () => void
  onStoryMode: () => void
  onDownloadAll: () => void
  isVisible?: boolean
}

export default function FloatingMenu({
  onHome,
  onGridView,
  onStoryMode,
  onDownloadAll,
  isVisible = true
}: FloatingMenuProps) {
  // Auto-hide logic based on scroll direction could be added here or passed via props
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform"
        >
          <div className="flex items-center gap-1 rounded-full bg-black/80 p-1.5 shadow-2xl backdrop-blur-md border border-white/10">
            <MenuButton 
              icon={<HomeIcon className="h-5 w-5" />} 
              label="Home" 
              onClick={onHome} 
            />
            <div className="h-4 w-px bg-white/20 mx-1" />
            <MenuButton 
              icon={<Squares2X2Icon className="h-5 w-5" />} 
              label="Grid" 
              onClick={onGridView} 
              active
            />
            <MenuButton 
              icon={<PlayIcon className="h-5 w-5" />} 
              label="Story" 
              onClick={onStoryMode} 
            />
            <div className="h-4 w-px bg-white/20 mx-1" />
            <MenuButton 
              icon={<ArrowDownTrayIcon className="h-5 w-5" />} 
              label="Save" 
              onClick={onDownloadAll} 
              primary
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MenuButton({ 
  icon, 
  label, 
  onClick, 
  active = false,
  primary = false
}: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void,
  active?: boolean,
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center rounded-full px-4 py-2 transition-all
        ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
        ${primary ? 'bg-white text-black hover:bg-white/90 font-medium' : ''}
      `}
    >
      <div className={`${primary ? 'text-black' : ''}`}>
        {icon}
      </div>
      {!primary && (
        <span className="sr-only">{label}</span>
      )}
      {primary && (
        <span className="ml-2 hidden text-xs font-medium md:inline-block">Download</span>
      )}
    </button>
  )
}
