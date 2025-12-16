/**
 * Comment Validation Utilities
 */

import DOMPurify from 'isomorphic-dompurify';

export interface CommentValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    email?: string;
    message?: string;
    relationship?: string;
  };
}

export interface CommentInput {
  name: string;
  email?: string;
  message: string;
  relationship?: string;
}

/**
 * Validate comment input
 */
export function validateComment(input: CommentInput): CommentValidationResult {
  const errors: CommentValidationResult['errors'] = {};

  // Validate name
  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (input.name.trim().length > 50) {
    errors.name = 'Name must be less than 50 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(input.name.trim())) {
    errors.name = 'Name must contain only letters and spaces';
  }

  // Validate email (if provided)
  if (input.email && input.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      errors.email = 'Invalid email format';
    } else if (input.email.trim().length > 100) {
      errors.email = 'Email must be less than 100 characters';
    }
  }

  // Validate message
  if (!input.message || input.message.trim().length === 0) {
    errors.message = 'Message is required';
  } else if (input.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (input.message.trim().length > 500) {
    errors.message = 'Message must be less than 500 characters';
  }

  // Validate relationship (if provided)
  if (input.relationship) {
    const validRelationships = ['Family', 'Friend', 'Colleague', 'Other'];
    if (!validRelationships.includes(input.relationship)) {
      errors.relationship = 'Invalid relationship type';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize comment input to prevent XSS
 */
export function sanitizeComment(input: CommentInput): CommentInput {
  return {
    name: DOMPurify.sanitize(input.name.trim(), { ALLOWED_TAGS: [] }),
    email: input.email ? DOMPurify.sanitize(input.email.trim(), { ALLOWED_TAGS: [] }) : undefined,
    message: DOMPurify.sanitize(input.message.trim(), { ALLOWED_TAGS: [] }),
    relationship: input.relationship
      ? DOMPurify.sanitize(input.relationship.trim(), { ALLOWED_TAGS: [] })
      : undefined,
  };
}

/**
 * Simple profanity filter
 */
export function containsProfanity(text: string): boolean {
  const profanityList = [
    'badword1',
    'badword2',
    // Add more as needed
  ];

  const lowerText = text.toLowerCase();
  return profanityList.some((word) => lowerText.includes(word));
}

/**
 * Detect spam patterns
 */
export function isSpam(text: string): boolean {
  // Check for excessive URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) return true;

  // Check for excessive repeated characters
  if (/(.)\1{10,}/.test(text)) return true;

  // Check for excessive uppercase
  const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (uppercaseRatio > 0.7 && text.length > 20) return true;

  return false;
}
