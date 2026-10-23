const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

// Path for local persistent database file
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB structure
function loadLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      ward_inputs: [],
      source_evidence: [],
      parameter_measurements: [],
      action_states: [],
      test_results: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return {
      ward_inputs: [],
      source_evidence: [],
      parameter_measurements: [],
      action_states: [],
      test_results: []
    };
  }
}

function saveLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write local db:', err.message);
  }
}

// Optional Supabase Client initialization
let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client initialized with endpoint:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase initialization failed, falling back to local persistent store:', err.message);
  }
}

/**
 * 1. Store Ward Water Quality Reporter Inputs, Source Evidence, and Action States
 */
async function saveWardAudit(report) {
  const db = loadLocalDb();
  const timestamp = new Date().toISOString();

  // 1. Input record
  const inputRecord = {
    id: 'inp-' + Math.random().toString(36).substring(2, 9),
    request_id: report.requestId,
    ward_id: report.wardId || report.wardInput,
    ward_number: report.wardNumber || null,
    ward_name: report.wardName,
    city: report.city,
    state: report.state,
    period: report.period,
    created_at: timestamp
  };
  db.ward_inputs.unshift(inputRecord);

  // 2. Source evidence record
  const evidenceRecord = {
    id: 'evi-' + Math.random().toString(36).substring(2, 9),
    request_id: report.requestId,
    source_dashboard: report.sourceDashboard || 'Public Government Portal',
    source_url: report.sourceUrl,
    laboratory_id: report.laboratoryId || 'N/A',
    sampling_location: report.samplingLocation || 'N/A',
    sample_date: report.sampleDate || null,
    retrieval_time: report.retrievalTime || timestamp,
    browserbase_session_id: report.browserbase?.sessionId || 'N/A',
    browserbase_replay_url: report.browserbase?.replayUrl || null,
    all_figures_sourced: !!report.verification?.allFiguresSourced,
    verification_status: report.verification?.status || 'UNVERIFIED'
  };
  db.source_evidence.unshift(evidenceRecord);

  // 3. Parameters
  if (report.parameters && report.parameters.length > 0) {
    report.parameters.forEach(p => {
      db.parameter_measurements.unshift({
        id: 'pm-' + Math.random().toString(36).substring(2, 9),
        request_id: report.requestId,
        param_key: p.paramKey,
        param_name: p.name || p.paramKey,
        category: p.category || 'General',
        raw_value: p.rawValue,
        raw_unit: p.rawUnit,
        normalized_value: p.normalizedValue,
        normalized_unit: p.normalizedUnit,
        acceptable_limit: p.acceptableLimit,
        permissible_limit: p.permissibleLimit,
        status: p.status,
        is_safe: p.isSafe,
        conversion_formula: p.unitConversion?.formula || 'Standard Unit',
        created_at: timestamp
      });
    });
  }

  // 4. Action state
  if (report.humanApproval) {
    const actionRecord = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      request_id: report.requestId,
      content_hash: report.humanApproval.contentHash,
      status: report.humanApproval.status,
      destination: report.humanApproval.proposedCompilation?.destination || 'Public Ward Portal',
      proposed_action: report.humanApproval.proposedCompilation?.proposedAction || 'Compile report',
      approved_by: report.humanApproval.approvedBy || null,
      approved_at: report.humanApproval.approvedAt || null,
      compiled_report_id: null,
      updated_at: timestamp
    };
    db.action_states.unshift(actionRecord);
  }

  // Save to persistent file
  saveLocalDb(db);

  // Push to Supabase if configured
  if (supabase) {
    try {
      await supabase.from('ward_inputs').insert(inputRecord);
      await supabase.from('source_evidence').insert(evidenceRecord);
      if (report.humanApproval) {
        await supabase.from('action_states').insert({
          request_id: report.requestId,
          content_hash: report.humanApproval.contentHash,
          status: report.humanApproval.status,
          destination: report.humanApproval.proposedCompilation?.destination || 'Public Ward Portal',
          proposed_action: report.humanApproval.proposedCompilation?.proposedAction || 'Compile report'
        });
      }
    } catch (err) {
      console.warn('Supabase remote insert notice:', err.message);
    }
  }

  return { success: true, requestId: report.requestId };
}

/**
 * 2. Update Action State upon Human Approval
 */
async function updateActionState(contentHash, approvalData) {
  const db = loadLocalDb();
  const state = db.action_states.find(s => s.content_hash === contentHash);
  const now = new Date().toISOString();

  if (state) {
    state.status = 'APPROVED';
    state.approved_by = approvalData.approvedBy;
    state.approved_at = approvalData.approvedAt || now;
    state.compiled_report_id = approvalData.compiledReportId;
    state.updated_at = now;
  } else {
    db.action_states.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      request_id: 'REQ-APPROVED',
      content_hash: contentHash,
      status: 'APPROVED',
      destination: approvalData.publishedDestination || 'Public Ward Dashboard',
      proposed_action: 'Compile and issue official Ward Water Quality Bulletin',
      approved_by: approvalData.approvedBy,
      approved_at: approvalData.approvedAt || now,
      compiled_report_id: approvalData.compiledReportId,
      updated_at: now
    });
  }

  saveLocalDb(db);

  if (supabase) {
    try {
      await supabase
        .from('action_states')
        .update({
          status: 'APPROVED',
          approved_by: approvalData.approvedBy,
          approved_at: approvalData.approvedAt || now,
          compiled_report_id: approvalData.compiledReportId
        })
        .eq('content_hash', contentHash);
    } catch (err) {
      console.warn('Supabase remote update notice:', err.message);
    }
  }

  return { success: true };
}

/**
 * 3. Store Official Hackathon Test Suite Results
 */
async function saveTestResults(suiteResults) {
  const db = loadLocalDb();
  const now = new Date().toISOString();

  if (Array.isArray(suiteResults)) {
    suiteResults.forEach(tc => {
      db.test_results.unshift({
        id: 'tc-' + Math.random().toString(36).substring(2, 9),
        test_id: tc.testId,
        scenario: tc.scenario,
        expected: tc.expected,
        actual: tc.actual,
        passed: tc.passed,
        evidence_json: tc.evidence,
        executed_at: now
      });
    });
  }

  saveLocalDb(db);

  if (supabase) {
    try {
      const rows = suiteResults.map(tc => ({
        test_id: tc.testId,
        scenario: tc.scenario,
        expected: tc.expected,
        actual: tc.actual,
        passed: tc.passed,
        evidence_json: tc.evidence
      }));
      await supabase.from('test_results').insert(rows);
    } catch (err) {
      console.warn('Supabase test_results remote insert notice:', err.message);
    }
  }

  return { success: true };
}

/**
 * Retrieve Audit History & Stored States
 */
function getAuditHistory() {
  const db = loadLocalDb();
  return {
    isSupabaseConnected: !!supabase,
    supabaseUrl: supabaseUrl || null,
    storageType: supabase ? 'Supabase Cloud + Local Backup' : 'Local Persistent Storage (Supabase-Ready)',
    counts: {
      inputs: db.ward_inputs.length,
      evidence: db.source_evidence.length,
      parameters: db.parameter_measurements.length,
      actionStates: db.action_states.length,
      testRuns: db.test_results.length
    },
    data: db
  };
}

module.exports = {
  saveWardAudit,
  updateActionState,
  saveTestResults,
  getAuditHistory
};
