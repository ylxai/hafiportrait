import { NextResponse } from 'next/server';
import { database } from '@/lib/database'; // Mengimpor database langsung

export async function GET() {
  try {
    const stats = await database.getStats(); // Menggunakan database langsung
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { message: "Failed to fetch stats", error: error.message },
      { status: 400 }
    );
  }
}