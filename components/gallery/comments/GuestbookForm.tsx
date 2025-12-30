'use client'

import { useState } from 'react'

interface GuestbookFormProps {
  eventSlug: string
  onSubmitted: (comment: any) => void
}

export default function GuestbookForm({ eventSlug, onSubmitted }: GuestbookFormProps) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [attendance, setAttendance] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nama wajib diisi')
      return
    }
    if (!attendance) {
      setError('Silakan pilih Hadir / Tidak Hadir')
      return
    }
    if (!message.trim()) {
      setError('Ucapan wajib diisi')
      return
    }

    setLoading(true)
    try {
      // guestId is required by API; reuse existing local storage key behavior
      const guestId = localStorage.getItem('hafiportrait_guest_id') || crypto.randomUUID()
      localStorage.setItem('hafiportrait_guest_id', guestId)

      const res = await fetch(`/api/gallery/${eventSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          name: name.trim(),
          relationship: relationship || undefined,
          attendance,
          message: message.trim(),
          honeypot: '',
        }),
        credentials: 'include',
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Gagal mengirim ucapan')
        return
      }

      if (data?.comment) onSubmitted(data.comment)

      setName('')
      setRelationship('')
      setAttendance('')
      setMessage('')
    } catch (e) {
      setError('Gagal mengirim ucapan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">Nama (wajib)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          placeholder="Nama Anda"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">Relasi (opsional)</label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Pilih relasi</option>
          <option value="Tamu">Tamu</option>
          <option value="Keluarga">Keluarga</option>
          <option value="Teman">Teman</option>
          <option value="Rekan kerja">Rekan kerja</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">Kehadiran (wajib)</label>
        <select
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          required
        >
          <option value="">Pilih</option>
          <option value="ATTENDING">Hadir</option>
          <option value="NOT_ATTENDING">Tidak Hadir</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">Ucapan (wajib)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          placeholder="Tulis ucapan untuk pasangan…"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#54ACBF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Mengirim…' : 'Kirim'}
      </button>
    </form>
  )
}
