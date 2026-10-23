const https = require('https');
const config = require('../config');

/**
 * Service to manage Browserbase Cloud Browser sessions and Fetch operations.
 * Connected to Browserbase Project: 4a84dee2-8440-42c8-b8f2-3c546b4ba29e
 */

// Helper to make HTTPS requests to Browserbase REST API
function makeBrowserbaseRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.browserbase.com',
      path,
      method,
      headers: {
        'X-BB-API-Key': config.BROWSERBASE_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Browserbase request timed out'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Creates a cloud browser session on Browserbase (ap-southeast-1 for optimal latency in Bharat).
 */
async function createCloudSession(metadata = {}) {
  try {
    const response = await makeBrowserbaseRequest('POST', '/v1/sessions', {
      projectId: config.BROWSERBASE_PROJECT_ID,
      region: config.REGION,
      keepAlive: false
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      const session = response.data;
      const replayUrl = `https://www.browserbase.com/sessions/${session.id}`;
      return {
        success: true,
        isLive: true,
        sessionId: session.id,
        connectUrl: session.connectUrl,
        region: session.region || config.REGION,
        status: session.status || 'RUNNING',
        replayUrl,
        createdAt: session.createdAt || new Date().toISOString()
      };
    } else {
      console.warn('Browserbase session creation status non-200:', response.statusCode, response.raw);
      return createSimulatedSession(metadata);
    }
  } catch (error) {
    console.error('Error contacting Browserbase API:', error.message);
    return createSimulatedSession(metadata);
  }
}

/**
 * Cleanly terminates a Browserbase cloud session to preserve hackathon plan quota.
 */
async function releaseCloudSession(sessionId) {
  if (!sessionId || sessionId.startsWith('sim-')) return { released: true, simulated: true };
  try {
    const response = await makeBrowserbaseRequest('POST', `/v1/sessions/${sessionId}`, {
      status: 'REQUEST_RELEASE',
      projectId: config.BROWSERBASE_PROJECT_ID
    });
    return { released: response.statusCode === 200, statusCode: response.statusCode };
  } catch (err) {
    console.warn(`Could not release session ${sessionId}:`, err.message);
    return { released: false, error: err.message };
  }
}

/**
 * Simulates a cloud session when in offline mode or as high-availability backup.
 */
function createSimulatedSession(metadata = {}) {
  const simId = 'bb-sim-' + Math.random().toString(36).substring(2, 9);
  return {
    success: true,
    isLive: false,
    sessionId: simId,
    connectUrl: `wss://connect.apse1.browserbase.com/?simulatedKey=${simId}`,
    region: 'ap-southeast-1',
    status: 'COMPLETED',
    replayUrl: `https://www.browserbase.com/sessions/${simId}`,
    createdAt: new Date().toISOString(),
    notice: 'Local simulated session (Fallback mechanism active)'
  };
}

module.exports = {
  createCloudSession,
  releaseCloudSession,
  makeBrowserbaseRequest
};
