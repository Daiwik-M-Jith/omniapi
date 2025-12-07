import { prisma } from './prisma';
import nodemailer from 'nodemailer';

interface NotificationPayload {
  apiId: string;
  apiName: string;
  apiUrl: string;
  previousStatus: string;
  currentStatus: string;
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export async function notifyStatusChange(
  apiId: string,
  apiName: string,
  apiUrl: string,
  previousStatus: string,
  currentStatus: string,
  responseTime?: number,
  error?: string
) {
  // Only notify on actual status changes
  if (previousStatus === currentStatus) return;

  const webhooks = await prisma.webhook.findMany({
    where: {
      apiId,
      isActive: true,
    },
  });

  const payload: NotificationPayload = {
    apiId,
    apiName,
    apiUrl,
    previousStatus,
    currentStatus,
    responseTime,
    error,
    timestamp: new Date().toISOString(),
  };

  const notificationPromises = webhooks.map((webhook) => {
    if (webhook.events.includes('status_change')) {
      switch (webhook.type) {
        case 'webhook':
          return sendWebhook(webhook.url!, payload);
        case 'slack':
          return sendSlackNotification(webhook.url!, payload);
        case 'discord':
          return sendDiscordNotification(webhook.url!, payload);
        case 'email':
          return sendEmailNotification(webhook.email!, payload);
        default:
          return Promise.resolve();
      }
    }
    return Promise.resolve();
  });

  try {
    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

async function sendWebhook(url: string, payload: NotificationPayload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OmniAPI-Monitor/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
}

async function sendSlackNotification(webhookUrl: string, payload: NotificationPayload) {
  const statusEmoji = payload.currentStatus === 'online' ? '✅' : payload.currentStatus === 'slow' ? '⚠️' : '🔴';
  const color = payload.currentStatus === 'online' ? 'good' : payload.currentStatus === 'slow' ? 'warning' : 'danger';

  const message = {
    text: `${statusEmoji} API Status Changed: ${payload.apiName}`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'API',
            value: payload.apiName,
            short: true,
          },
          {
            title: 'Status',
            value: `${payload.previousStatus} → ${payload.currentStatus}`,
            short: true,
          },
          {
            title: 'URL',
            value: payload.apiUrl,
            short: false,
          },
          ...(payload.responseTime
            ? [
                {
                  title: 'Response Time',
                  value: `${payload.responseTime}ms`,
                  short: true,
                },
              ]
            : []),
          ...(payload.error
            ? [
                {
                  title: 'Error',
                  value: payload.error,
                  short: false,
                },
              ]
            : []),
        ],
        footer: 'OmniAPI Monitor',
        ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

async function sendDiscordNotification(webhookUrl: string, payload: NotificationPayload) {
  const statusEmoji = payload.currentStatus === 'online' ? '✅' : payload.currentStatus === 'slow' ? '⚠️' : '🔴';
  const color = payload.currentStatus === 'online' ? 0x00ff00 : payload.currentStatus === 'slow' ? 0xffaa00 : 0xff0000;

  const message = {
    embeds: [
      {
        title: `${statusEmoji} API Status Changed`,
        description: `**${payload.apiName}** status changed from **${payload.previousStatus}** to **${payload.currentStatus}**`,
        color,
        fields: [
          {
            name: 'URL',
            value: payload.apiUrl,
          },
          ...(payload.responseTime
            ? [
                {
                  name: 'Response Time',
                  value: `${payload.responseTime}ms`,
                  inline: true,
                },
              ]
            : []),
          ...(payload.error
            ? [
                {
                  name: 'Error',
                  value: payload.error,
                },
              ]
            : []),
        ],
        timestamp: payload.timestamp,
        footer: {
          text: 'OmniAPI Monitor',
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord notification failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Discord notification error:', error);
  }
}

async function sendEmailNotification(email: string, payload: NotificationPayload) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const statusEmoji = payload.currentStatus === 'online' ? '✅' : payload.currentStatus === 'slow' ? '⚠️' : '🔴';

  const htmlContent = `
    <h2>${statusEmoji} API Status Changed</h2>
    <p><strong>${payload.apiName}</strong> status changed from <strong>${payload.previousStatus}</strong> to <strong>${payload.currentStatus}</strong></p>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>API Name</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payload.apiName}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>URL</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payload.apiUrl}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status Change</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payload.previousStatus} → ${payload.currentStatus}</td>
      </tr>
      ${
        payload.responseTime
          ? `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Response Time</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payload.responseTime}ms</td>
      </tr>`
          : ''
      }
      ${
        payload.error
          ? `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Error</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payload.error}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(payload.timestamp).toLocaleString()}</td>
      </tr>
    </table>
    <p style="margin-top: 20px; color: #666;">Sent by OmniAPI Monitor</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'OmniAPI Monitor <noreply@omniapi.com>',
      to: email,
      subject: `${statusEmoji} ${payload.apiName} - Status Changed to ${payload.currentStatus}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

export async function notifyIncidentCreated(incident: {
  id: string;
  apiId: string;
  title: string;
  severity: string;
}) {
  const api = await prisma.api.findUnique({
    where: { id: incident.apiId },
  });

  if (!api) return;

  const webhooks = await prisma.webhook.findMany({
    where: {
      apiId: incident.apiId,
      isActive: true,
    },
  });

  for (const webhook of webhooks) {
    if (webhook.events.includes('incident_created')) {
      // Send incident notifications (similar structure to status change)
      // Implementation similar to above
    }
  }
}
