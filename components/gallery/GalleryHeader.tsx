'use client';

import { useState, useEffect } from 'react';

interface GalleryHeaderProps {
  eventName: string;
  event_date?: Date | null;
  location?: string | null;
  photoCount: number;
  loadedPhotoCount?: number;
}

export default function GalleryHeader({
  eventName,
  event_date,
  location,
  photoCount,
  loadedPhotoCount = 0,
}: GalleryHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsCollapsed(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (date: Date | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <header className={`bg-white shadow-sm sticky top-0 z-10 transition-all duration-300 ${
      isCollapsed ? 'py-2' : 'py-4'
    }`}>
      <div className="container mx-auto px-4">
        {/* EXPANDED STATE */}
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {eventName}
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                {event_date && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event_date)}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1 sm:ml-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location}
                  </span>
                )}
                <span className="flex items-center gap-1 sm:ml-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {photoCount} foto
                </span>
              </div>
            </div>
          </div>
        )}

        {/* COLLAPSED STATE */}
        {isCollapsed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <h1 className="font-bold text-gray-900">{eventName}</h1>
              {event_date && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{formatDateShort(event_date)}</span>
                </>
              )}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {loadedPhotoCount > 0 ? loadedPhotoCount : photoCount} / {photoCount}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
