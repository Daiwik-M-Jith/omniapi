import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get a specific API with its check history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!api) {
      return NextResponse.json({ error: 'API not found' }, { status: 404 });
    }

    return NextResponse.json(api);
  } catch (error) {
    console.error('Error fetching API:', error);
    return NextResponse.json({ error: 'Failed to fetch API' }, { status: 500 });
  }
}

// Update an API
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, method, description, category } = body;

    const api = await prisma.api.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(method && { method }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
      },
    });

    return NextResponse.json(api);
  } catch (error) {
    console.error('Error updating API:', error);
    return NextResponse.json({ error: 'Failed to update API' }, { status: 500 });
  }
}

// Delete an API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.api.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API:', error);
    return NextResponse.json({ error: 'Failed to delete API' }, { status: 500 });
  }
}
