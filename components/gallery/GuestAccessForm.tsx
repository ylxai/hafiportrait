'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GuestAccessFormProps {
  eventSlug: string;
  eventName?: string;
  eventDate?: string | null;
  coverPhotoUrl?: string | null;
}

export default function GuestAccessForm({
  eventSlug,
  eventName,
  eventDate,
  coverPhotoUrl,
}: GuestAccessFormProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/gallery/${eventSlug}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid access code. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - redirect to gallery
      router.push(`/${eventSlug}/gallery`);
    } catch (err) {
      console.error('Access error:', err);
      setError('Failed to validate access code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setAccessCode(value);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Cover Photo */}
        {coverPhotoUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl relative h-64">
            <Image
              src={coverPhotoUrl}
              alt={`${eventName || 'Event'} cover photo`}
              fill
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Access Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {eventName || 'Event Gallery'}
            </h1>
            {eventDate && (
              <p className="text-gray-600">
                {formatDate(eventDate)}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Masukkan Kode Akses
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={handleAccessCodeChange}
                placeholder="ABC123"
                className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                maxLength={6}
                required
                autoComplete="off"
                disabled={isLoading}
              />
              <p className="mt-2 text-sm text-gray-500 text-center">
                Kode akses 6 karakter
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || accessCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? 'Memvalidasi...' : 'Lihat Gallery'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Tidak punya kode akses? Hubungi penyelenggara acara.
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Powered by <span className="font-semibold">Hafiportrait Photography</span>
          </p>
        </div>
      </div>
    </div>
  );
}
