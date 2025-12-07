import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Delete a webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}

// Update a webhook
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    const body = await request.json();
    const { isActive, events } = body;

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(events && { events }),
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}
