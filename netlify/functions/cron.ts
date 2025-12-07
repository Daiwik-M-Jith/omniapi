import { Handler } from '@netlify/functions';
import { checkAllAPIs } from '../../lib/monitor';

export const handler: Handler = async (event, context) => {
  try {
    // Run checks (10 concurrent checks)
    await checkAllAPIs(10);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Checks completed' }),
    };
  } catch (error) {
    console.error('Scheduled cron error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(error) }),
    };
  }
};
