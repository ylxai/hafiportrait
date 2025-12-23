'use client';

/**
 * Comment Form Component
 * Allows guests to submit comments/messages
 */

import { useState } from 'react';
import { useGuestIdentifier } from '@/hooks/useGuestIdentifier';

interface CommentFormProps {
  eventSlug: string;
  photo_id?: string;
  onCommentSubmitted?: (comment: { id: string; guest_name: string; message: string; created_at: string }) => void;
}

export default function CommentForm({
  eventSlug,
  photo_id,
  onCommentSubmitted,
}: CommentFormProps) {
  const { guestId } = useGuestIdentifier();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [relationship, setRelationship] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const characterCount = message.length;
  const characterLimit = 500;
  const isValid = name.trim().length > 0 && message.trim().length >= 10 && message.trim().length <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || !guestId) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/gallery/${eventSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          message: message.trim(),
          relationship: relationship || undefined,
          guestId,
          photo_id: photo_id || undefined,
          honeypot,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      const data = await response.json();
      
      // Success!
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      setRelationship('');

      // Call callback
      if (onCommentSubmitted) {
        onCommentSubmitted(data.comment);
      }

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field (hidden) */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="Your name"
        />
      </div>

      {/* Email Input (Optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={100}
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="your@email.com"
        />
      </div>

      {/* Relationship Dropdown (Optional) */}
      <div>
        <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
          Relationship <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <select
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Select relationship</option>
          <option value="Family">Family</option>
          <option value="Friend">Friend</option>
          <option value="Colleague">Colleague</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Message Textarea */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
          placeholder="Write your message here... (min 10 characters)"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">Minimum 10 characters</p>
          <p
            className={`text-xs ${
              characterCount > characterLimit
                ? 'text-red-500 font-medium'
                : characterCount > characterLimit * 0.9
                ? 'text-orange-500'
                : 'text-gray-500'
            }`}
          >
            {characterCount}/{characterLimit}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">✓ Comment submitted successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Posting...' : 'Post Message'}
      </button>
    </form>
  );
}
