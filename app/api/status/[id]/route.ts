import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if requesting badge
    const url = new URL(request.url);
    if (url.pathname.endsWith('/badge.svg') || url.searchParams.get('badge') === 'true') {
      return generateBadge(id);
    }

    // Get API with latest check
    const api = await prisma.api.findUnique({
      where: { id, isPublic: true },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!api) {
      return NextResponse.json({ error: 'API not found or not public' }, { status: 404 });
    }

    // Calculate uptime
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChecks = api.checks.filter((c) => new Date(c.checkedAt) >= last24Hours);
    const onlineChecks = recentChecks.filter((c) => c.status === 'online').length;
    const uptime = recentChecks.length > 0 ? (onlineChecks / recentChecks.length) * 100 : 0;

    const avgResponseTime =
      recentChecks.length > 0
        ? recentChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / recentChecks.length
        : 0;

    return NextResponse.json({
      id: api.id,
      name: api.name,
      url: api.url,
      status: api.checks[0]?.status || 'unknown',
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      lastCheck: api.checks[0] || null,
      history: api.checks.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

async function generateBadge(apiId: string) {
  try {
    const api = await prisma.api.findUnique({
      where: { id: apiId, isPublic: true },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!api) {
      return new Response(createSVGBadge('status', 'unknown', '#gray'), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const status = api.checks[0]?.status || 'unknown';
    const colors = {
      online: '#4ade80',
      slow: '#fbbf24',
      offline: '#ef4444',
      unknown: '#6b7280',
    };

    const color = colors[status as keyof typeof colors] || colors.unknown;

    return new Response(createSVGBadge('status', status, color), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=60',
      },
    });
  } catch {
    return new Response(createSVGBadge('status', 'error', '#ef4444'), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

function createSVGBadge(label: string, value: string, color: string): string {
  const labelWidth = label.length * 7 + 10;
  const valueWidth = value.length * 7 + 10;
  const totalWidth = labelWidth + valueWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>
  `.trim();
}
