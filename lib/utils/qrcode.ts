import QRCode from 'qrcode'

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#011C40', // Brand navy
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('QR code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as buffer (for storage)
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#011C40',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
    return buffer
  } catch (error) {
    console.error('QR code buffer generation failed:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}
