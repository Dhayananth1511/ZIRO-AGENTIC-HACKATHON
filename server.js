const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { getAllWards, getWardRecord } = require('./src/services/waterDataService');
const { runWardWaterReporterAgent, approveCompilation } = require('./src/services/agentLoop');
const { runAllTestCases } = require('./src/services/testRunner');
const { makeBrowserbaseRequest } = require('./src/services/browserbaseService');
const { getAuditHistory } = require('./src/services/dbService');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all registered wards
app.get('/api/wards', (req, res) => {
  try {
    const wards = getAllWards();
    res.json({ success: true, count: wards.length, data: wards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Run agent investigation loop
app.post('/api/agent/investigate', async (req, res) => {
  const { wardId, period = '2026-Q4', fastMode = false } = req.body;
  try {
    const report = await runWardWaterReporterAgent(wardId, period, { skipCloudSession: fastMode });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// API: Human-in-the-Loop approval gate (Permitted Action)
app.post('/api/agent/approve', (req, res) => {
  const { contentHash, approvedBy = 'Citizen Auditor & Ward Corporator' } = req.body;
  try {
    const result = approveCompilation(contentHash, approvedBy);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Run all 4 official hackathon test cases
app.get('/api/test-suite/run', async (req, res) => {
  try {
    const testSuiteResult = await runAllTestCases();
    res.json({ success: true, ...testSuiteResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Audit History from Database (Supabase / Local Persistent Store)
app.get('/api/database/history', (req, res) => {
  try {
    const history = getAuditHistory();
    res.json({ success: true, ...history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Browserbase status & health check
app.get('/api/browserbase/status', async (req, res) => {
  try {
    const response = await makeBrowserbaseRequest('GET', '/v1/sessions');
    res.json({
      success: true,
      statusCode: response.statusCode,
      projectId: config.BROWSERBASE_PROJECT_ID,
      region: config.REGION,
      liveSessionsCount: Array.isArray(response.data) ? response.data.length : 0,
      activeStatus: response.statusCode === 200 ? 'CONNECTED_AND_AUTHENTICATED' : 'WARNING'
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      projectId: config.BROWSERBASE_PROJECT_ID,
      region: config.REGION,
      activeStatus: 'OFFLINE_SIMULATION_READY'
    });
  }
});

// Health check for Render and cloud monitors
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Express Server
const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` AquaWard AI - Ward Water Quality Reporter`);
  console.log(` Ziro Agentic AI Hackathon 2026 (Agents for Bharat)`);
  console.log(` Team: ${config.TEAM_NAME} | Author: ${config.AUTHOR_NAME}`);
  console.log(` Server running on port: ${PORT}`);
  console.log(` Browserbase Project: ${config.BROWSERBASE_PROJECT_ID}`);
  console.log(`====================================================`);
});
