import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { uploadToR2 } from '@/lib/storage/r2'
import { generateThumbnail } from '@/lib/storage/image-processor'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slides = await prisma.hero_slideshow.findMany({
      orderBy: { display_order: 'asc' }
    })

    const settings = await prisma.slideshow_settings.findFirst()

    return NextResponse.json({ slides, settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch slideshow' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '')
    const filename = `hero-slideshow/hero-${timestamp}-${sanitizedName}`

    // Upload original to R2
    const uploadResult = await uploadToR2(fileBuffer, filename, file.type || 'image/jpeg')

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || 'Upload failed' }, { status: 500 })
    }

    // Generate thumbnail
    const thumbnailResult = await generateThumbnail(fileBuffer, 'medium')
    const thumbnailFilename = `hero-slideshow/thumbnails/hero-${timestamp}-thumb-${sanitizedName}`
    const thumbnailUpload = await uploadToR2(
      thumbnailResult.buffer,
      thumbnailFilename,
      file.type || 'image/jpeg'
    )

    if (!thumbnailUpload.success) {
      return NextResponse.json({ error: thumbnailUpload.error || 'Thumbnail upload failed' }, { status: 500 })
    }

    // Get next display order
    const lastSlide = await prisma.hero_slideshow.findFirst({
      orderBy: { display_order: 'desc' }
    })
    const nextOrder = (lastSlide?.display_order ?? -1) + 1

    const slide = await prisma.hero_slideshow.create({
      data: {
        id: crypto.randomUUID(),
        image_url: uploadResult.url,
        thumbnail_url: thumbnailUpload.url,
        title: title || null,
        subtitle: subtitle || null,
        display_order: nextOrder,
        is_active: true,
        updated_at: new Date(),
      }
    })

    return NextResponse.json(slide)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 })
  }
}
