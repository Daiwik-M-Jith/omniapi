import { prisma } from './prisma';
import { notifyStatusChange } from './notifications';
import { checkAndCreateIncident } from './incidents';
import pLimit from 'p-limit';
import * as tls from 'tls';

interface CheckResult {
  status: 'online' | 'slow' | 'offline';
  responseTime: number | null;
  statusCode: number | null;
  error: string | null;
  sslDaysLeft: number | null;
}

export async function performCheck(apiId: string, region?: string): Promise<CheckResult> {
  const api = await prisma.api.findUnique({ where: { id: apiId } });

  if (!api) {
    throw new Error('API not found');
  }

  const startTime = Date.now();
  const result: CheckResult = {
    status: 'offline',
    responseTime: null,
    statusCode: null,
    error: null,
    sslDaysLeft: null,
  };

  // SSL Check
  if (api.sslCheckEnabled && api.url.startsWith('https://')) {
    try {
      result.sslDaysLeft = await checkSSL(api.url);
    } catch (err) {
      console.error('SSL check error:', err);
    }
  }

  // HTTP Check with retries
  let attempt = 0;
  const maxAttempts = api.retries + 1;

  while (attempt < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), api.timeoutMs);

      // Prepare headers
      let headers: Record<string, string> = {
        'User-Agent': 'OmniAPI-Monitor/1.0',
      };

      if (api.headers) {
        try {
          const customHeaders = JSON.parse(api.headers);
          headers = { ...headers, ...customHeaders };
        } catch (e) {
          console.error('Invalid headers JSON:', e);
        }
      }

      // Add authentication
      if (api.authType === 'basic' && api.authUsername && api.authPassword) {
        const auth = Buffer.from(`${api.authUsername}:${api.authPassword}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else if (api.authType === 'bearer' && api.authToken) {
        headers['Authorization'] = `Bearer ${api.authToken}`;
      }

      const response = await fetch(api.url, {
        method: api.method,
        signal: controller.signal,
        headers,
        redirect: api.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);
      result.responseTime = Date.now() - startTime;
      result.statusCode = response.status;

      // Check expected status codes
      const expectedCodes = api.expectedStatus
        ? api.expectedStatus.split(',').map((s) => parseInt(s.trim()))
        : [200];

      if (!expectedCodes.includes(response.status)) {
        result.status = 'offline';
        result.error = `HTTP ${response.status} (expected ${expectedCodes.join(', ')})`;
        break;
      }

      // Content matching
      if (api.contentMatch) {
        const body = await response.text();
        const regex = new RegExp(api.contentMatch);
        if (!regex.test(body)) {
          result.status = 'offline';
          result.error = 'Content match failed';
          break;
        }
      }

      // Success!
      result.status = result.responseTime > 2000 ? 'slow' : 'online';
      result.error = null;
      break;
    } catch (err) {
      result.responseTime = Date.now() - startTime;
      result.status = 'offline';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          result.error = `Timeout after ${api.timeoutMs}ms`;
        } else {
          result.error = err.message;
        }
      } else {
        result.error = 'Unknown error';
      }

      attempt++;
      if (attempt < maxAttempts) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Get previous status for comparison
  const lastCheck = await prisma.check.findFirst({
    where: { apiId: api.id },
    orderBy: { checkedAt: 'desc' },
  });

  // Save check result
  await prisma.check.create({
    data: {
      apiId: api.id,
      status: result.status,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      error: result.error,
      sslDaysLeft: result.sslDaysLeft,
      region: region || 'default',
    },
  });

  // Notify on status change
  if (lastCheck && lastCheck.status !== result.status) {
    await notifyStatusChange(
      api.id,
      api.name,
      api.url,
      lastCheck.status,
      result.status,
      result.responseTime || undefined,
      result.error || undefined
    );
  }

  // Handle incidents
  await checkAndCreateIncident(api.id, api.name, result.status, result.error || undefined);

  return result;
}

export async function checkAllAPIs(concurrency: number = 5, region?: string) {
  const apis = await prisma.api.findMany();
  const limit = pLimit(concurrency);

  const results = await Promise.all(
    apis.map((api) =>
      limit(async () => {
        try {
          return await performCheck(api.id, region);
        } catch (error) {
          console.error(`Error checking API ${api.id}:`, error);
          return {
            status: 'offline' as const,
            responseTime: null,
            statusCode: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            sslDaysLeft: null,
          };
        }
      })
    )
  );

  return {
    checked: apis.length,
    results: apis.map((api, index) => ({
      apiId: api.id,
      apiName: api.name,
      ...results[index],
    })),
  };
}

async function checkSSL(url: string): Promise<number | null> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const port = parseInt(urlObj.port) || 443;

    return new Promise((resolve, reject) => {
      const socket = tls.connect(port, hostname, { servername: hostname }, () => {
        const cert = socket.getPeerCertificate();
        socket.end();

        if (!cert || !cert.valid_to) {
          resolve(null);
          return;
        }

        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysLeft = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        resolve(daysLeft);
      });

      socket.on('error', (err) => {
        reject(err);
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('SSL check timeout'));
      });
    });
  } catch (error) {
    console.error('SSL check error:', error);
    return null;
  }
}
