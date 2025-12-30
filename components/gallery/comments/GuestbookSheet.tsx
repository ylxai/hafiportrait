'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useComments } from '@/hooks/useComments'
import CommentForm from './CommentForm'
import CommentList from './CommentList'

interface GuestbookSheetProps {
  eventSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function GuestbookSheet({ eventSlug, isOpen, onClose }: GuestbookSheetProps) {
  const [showForm, setShowForm] = useState(false)
  const { comments, isLoading, totalCount, addComment } = useComments({
    eventSlug,
    autoLoad: isOpen,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-900" />
                <div className="font-semibold text-gray-900">
                  Beri Ucapan{totalCount > 0 ? ` (${totalCount})` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Tutup"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mb-4 w-full rounded-xl bg-[#54ACBF] px-4 py-3 text-sm font-semibold text-white"
              >
                Tulis Ucapan
              </button>
            )}

            {showForm && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium text-gray-900">Tulis Ucapan</div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-sm text-gray-600"
                  >
                    Batal
                  </button>
                </div>

                <CommentForm
                  eventSlug={eventSlug}
                  onCommentSubmitted={(c) => {
                    addComment(c)
                    setShowForm(false)
                  }}
                />
              </div>
            )}

            <CommentList comments={comments} isLoading={isLoading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
