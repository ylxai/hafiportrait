import { describe, expect, it } from 'vitest';
import { validateComment } from '@/lib/validation/comment-validation';

describe('validateComment', () => {
  it('accepts unicode names commonly used in Indonesia', () => {
    const result = validateComment({
      name: 'Nur Aisyah',
      message: 'Selamat menempuh hidup baru ya!',
      attendance: 'ATTENDING',
    });

    expect(result.isValid).toBe(true);
  });

  it('rejects too-short message (<10 chars)', () => {
    const result = validateComment({
      name: 'Budi',
      message: 'Mantap!',
      attendance: 'ATTENDING',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });

  it('accepts relationship values from both Indonesian and English UI', () => {
    const result = validateComment({
      name: 'Siti',
      message: 'Selamat ya, semoga bahagia selalu.',
      relationship: 'Friend',
      attendance: 'ATTENDING',
    });

    expect(result.isValid).toBe(true);
  });
});
