import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all APIs
export async function GET() {
  try {
    const apis = await prisma.api.findMany({
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Calculate uptime for each API
    const apisWithStats = await Promise.all(
      apis.map(async (api) => {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const checks = await prisma.check.findMany({
          where: {
            apiId: api.id,
            checkedAt: { gte: last24Hours },
          },
        });

        const totalChecks = checks.length;
        const onlineChecks = checks.filter((c) => c.status === 'online').length;
        const uptime = totalChecks > 0 ? (onlineChecks / totalChecks) * 100 : 0;
        const avgResponseTime = 
          checks.length > 0
            ? checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks.length
            : 0;

        return {
          ...api,
          uptime: Math.round(uptime * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime),
          lastCheck: api.checks[0] || null,
        };
      })
    );

    return NextResponse.json(apisWithStats);
  } catch (error) {
    console.error('Error fetching APIs:', error);
    return NextResponse.json({ error: 'Failed to fetch APIs' }, { status: 500 });
  }
}

// Add a new API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      url,
      method = 'GET',
      description,
      category,
      intervalSeconds,
      timeoutMs,
      retries,
      expectedStatus,
      contentMatch,
      sslCheckEnabled,
      followRedirects,
      headers,
      authType,
      authUsername,
      authPassword,
      authToken,
      isPublic,
    } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const api = await prisma.api.create({
      data: {
        name,
        url,
        method,
        description,
        category,
        ...(intervalSeconds && { intervalSeconds }),
        ...(timeoutMs && { timeoutMs }),
        ...(retries !== undefined && { retries }),
        ...(expectedStatus && { expectedStatus }),
        ...(contentMatch && { contentMatch }),
        ...(sslCheckEnabled !== undefined && { sslCheckEnabled }),
        ...(followRedirects !== undefined && { followRedirects }),
        ...(headers && { headers: JSON.stringify(headers) }),
        ...(authType && { authType }),
        ...(authUsername && { authUsername }),
        ...(authPassword && { authPassword }),
        ...(authToken && { authToken }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(api, { status: 201 });
  } catch (error) {
    console.error('Error creating API:', error);
    return NextResponse.json({ error: 'Failed to create API' }, { status: 500 });
  }
}
