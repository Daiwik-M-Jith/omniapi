import { NextResponse } from 'next/server';
import { checkAllAPIs } from '@/lib/monitor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cron job endpoint to check all APIs periodically
export async function GET(request: Request) {
  try {
    // Verify authorization (Vercel Cron uses Authorization header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await checkAllAPIs(10); // Higher concurrency for cron

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      {
        error: 'Failed to run cron job',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
