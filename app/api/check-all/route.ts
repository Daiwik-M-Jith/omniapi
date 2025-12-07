import { NextResponse } from 'next/server';
import { checkAllAPIs } from '@/lib/monitor';

// Check all APIs
export async function POST() {
  try {
    const results = await checkAllAPIs(5); // 5 concurrent checks
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error checking APIs:', error);
    return NextResponse.json({ error: 'Failed to check APIs' }, { status: 500 });
  }
}
