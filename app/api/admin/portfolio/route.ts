import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photos = await prisma.portfolioPhoto.findMany({
      orderBy: { displayOrder: 'desc' }
    })

    return NextResponse.json({ photos })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}
