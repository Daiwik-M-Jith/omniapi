import { prisma } from './prisma';

export async function checkAndCreateIncident(
  apiId: string,
  apiName: string,
  status: string,
  error?: string
) {
  // Only create incidents for offline status
  if (status !== 'offline') {
    // Check if there's an open incident to resolve
    const openIncident = await prisma.incident.findFirst({
      where: {
        apiId,
        status: { in: ['open', 'acknowledged'] },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (openIncident && status === 'online') {
      // Auto-resolve the incident
      await prisma.incident.update({
        where: { id: openIncident.id },
        data: {
          status: 'resolved',
          endedAt: new Date(),
          notes: 'Auto-resolved: API returned to online status',
        },
      });
    }
    return null;
  }

  // Check if there's already an open incident for this API
  const existingIncident = await prisma.incident.findFirst({
    where: {
      apiId,
      status: { in: ['open', 'acknowledged'] },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (existingIncident) {
    // Update existing incident
    await prisma.incident.update({
      where: { id: existingIncident.id },
      data: {
        description: error || 'API is offline',
        updatedAt: new Date(),
      },
    });
    return existingIncident;
  }

  // Create new incident
  const incident = await prisma.incident.create({
    data: {
      apiId,
      title: `${apiName} is offline`,
      description: error || 'API is not responding',
      severity: 'high',
      status: 'open',
    },
  });

  return incident;
}

export async function getIncidentStats(apiId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const incidents = await prisma.incident.findMany({
    where: {
      apiId,
      startedAt: { gte: since },
    },
    orderBy: { startedAt: 'desc' },
  });

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').length;
  const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'acknowledged').length;

  // Calculate MTTR (Mean Time To Resolution)
  const resolvedWithTime = incidents.filter((i) => i.endedAt && i.startedAt);
  const mttr =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, i) => {
          const duration = i.endedAt!.getTime() - i.startedAt.getTime();
          return sum + duration;
        }, 0) / resolvedWithTime.length
      : 0;

  return {
    totalIncidents,
    resolvedIncidents,
    openIncidents,
    mttrMinutes: Math.round(mttr / 1000 / 60),
    incidents,
  };
}
