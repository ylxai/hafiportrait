import { generateEventUrl } from '@/lib/app-config';

/**
 * QR Code Generator Utility
 * Generates QR codes for events
 */

/**
 * Generate a QR code for an event
 * @param eventId The ID of the event
 * @param accessCode The access code for the event
 * @returns A data URL for the QR code
 */
export async function generateQRCode(eventId: string, accessCode: string): Promise<string> {
  try {
    // Use dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')).default;
    
    // Create the URL for the event with access code using centralized config
    const eventUrl = generateEventUrl(eventId, accessCode);
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(eventUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate a shareable link for an event
 * @param eventId The ID of the event
 * @param accessCode The access code for the event
 * @returns A shareable link for the event
 */
export function generateShareableLink(eventId: string, accessCode: string): string {
  return generateEventUrl(eventId, accessCode);
}