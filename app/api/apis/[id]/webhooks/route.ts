import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all webhooks for an API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const webhooks = await prisma.webhook.findMany({
      where: { apiId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// Create a new webhook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, url, email, events } = body;

    if (!type || !['webhook', 'slack', 'discord', 'email'].includes(type)) {
      return NextResponse.json({ error: 'Invalid webhook type' }, { status: 400 });
    }

    if ((type === 'webhook' || type === 'slack' || type === 'discord') && !url) {
      return NextResponse.json({ error: 'URL is required for this webhook type' }, { status: 400 });
    }

    if (type === 'email' && !email) {
      return NextResponse.json({ error: 'Email is required for email notifications' }, { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        apiId: id,
        type,
        url: url || null,
        email: email || null,
        events: events || 'status_change',
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
