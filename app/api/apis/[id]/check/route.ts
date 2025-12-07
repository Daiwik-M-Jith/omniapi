import { NextRequest, NextResponse } from 'next/server';
import { performCheck } from '@/lib/monitor';

// Check a specific API's status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await performCheck(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check API' },
      { status: 500 }
    );
  }
}
