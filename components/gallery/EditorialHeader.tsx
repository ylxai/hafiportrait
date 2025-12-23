'use client';

import { motion } from 'framer-motion'

interface EditorialHeaderProps {
  eventName: string;
  event_date?: Date | null;
  location?: string | null;
}

export default function EditorialHeader({
  eventName,
  event_date,
  location,
}: EditorialHeaderProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).toUpperCase();
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="py-12 md:py-20 text-center px-4"
    >
      {event_date && (
        <p className="text-xs md:text-sm font-medium tracking-[0.2em] text-gray-500 mb-4 uppercase">
          {formatDate(event_date)} {location ? `— ${location}` : ''}
        </p>
      )}
      
      <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-900 tracking-tight leading-tight">
        {eventName}
      </h1>
      
      <div className="mt-8 mx-auto w-16 h-px bg-gray-300" />
    </motion.header>
  );
}
