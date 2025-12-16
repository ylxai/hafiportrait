import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { handleError } from '@/lib/errors/handler'
import { generateQRCode } from '@/lib/utils/qrcode'

// POST - Generate QR code for event
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    // FIXED: Separate 401 and 403
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get event - using explicit select to avoid coupleName field
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        slug: true,
        accessCode: true,
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Generate QR code URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const galleryUrl = `${baseUrl}/${event.slug}?code=${event.accessCode}`

    // Generate QR code as data URL
    const qrCodeDataUrl = await generateQRCode(galleryUrl)

    // For now, store as data URL (later can upload to R2)
    await prisma.event.update({
      where: { id: params.id },
      data: {
        qrCodeUrl: qrCodeDataUrl,
      },
    })

    return NextResponse.json({
      message: 'QR code generated successfully',
      qrCodeUrl: qrCodeDataUrl,
    })
  } catch (error) {
    return handleError(error)
  }
}
