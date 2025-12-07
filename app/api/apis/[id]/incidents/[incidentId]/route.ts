import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update an incident
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  try {
    const { incidentId } = await params;
    const body = await request.json();
    const { status, notes, resolvedBy } = body;

    const updateData: {
      status?: string;
      notes?: string;
      resolvedBy?: string;
      endedAt?: Date;
    } = {};

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.endedAt = new Date();
      }
    }

    if (notes) updateData.notes = notes;
    if (resolvedBy) updateData.resolvedBy = resolvedBy;

    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: updateData,
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}
