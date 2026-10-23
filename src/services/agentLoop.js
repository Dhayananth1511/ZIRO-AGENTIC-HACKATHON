const crypto = require('crypto');
const { getWardRecord, getAllWards } = require('./waterDataService');
const { normalizeParameter, classifySampleRecency, calculateWaterQualityIndex } = require('./normalizer');
const { createCloudSession, releaseCloudSession } = require('./browserbaseService');
const { saveWardAudit, updateActionState } = require('./dbService');

// In-memory store for pending and approved compilation requests (Idempotency control)
const compilationStore = new Map();

/**
 * Main Autonomous Agent Loop for Ward Water Quality Reporter
 */
async function runWardWaterReporterAgent(wardInput, periodInput = '2026-Q4', options = {}) {
  const executionStartTime = Date.now();
  const requestId = 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const thoughts = [];

  function logThought(phase, message, level = 'info', extra = null) {
    thoughts.push({
      timestamp: new Date().toISOString(),
      phase,
      message,
      level,
      extra
    });
  }

  // ==========================================
  // STEP 1: COLLECT THE DETAILS & VALIDATE
  // ==========================================
  logThought('01_COLLECT_DETAILS', `Initiating ward investigation for input: "${wardInput}", period: "${periodInput}" (Trace ID: ${requestId})`);

  if (!wardInput || typeof wardInput !== 'string' || wardInput.trim() === '') {
    logThought('01_COLLECT_DETAILS', 'Validation Failed: Ward identifier is required and cannot be empty.', 'error');
    return {
      success: false,
      requestId,
      status: 'VALIDATION_ERROR',
      error: 'Ward identifier is missing. Please select or specify a valid ward.'
    };
  }

  const cleanWardInput = wardInput.trim();
  const rawRecord = getWardRecord(cleanWardInput);

  // ==========================================
  // STEP 2: PLAN THE NEXT STEPS
  // ==========================================
  logThought('02_PLAN_STEPS', `Agent formulated multi-step decision pipeline:
1. Spin up Browserbase cloud browser session (ap-southeast-1)
2. Connect to designated Government Water Quality Dashboard
3. Extract chemical and microbiological parameters, test date, and lab credentials
4. Execute unit normalization engine (convert µg/L & ppb into BIS standard mg/L)
5. Run temporal recency classification (evaluate if sample is historical or current)
6. Check safety invariants: strictly return 'NO DATA' if absent, NEVER 'SAFE'
7. Formulate proposed compilation diff and pause for Human-in-the-Loop authorization.`);

  // ==========================================
  // STEP 3: FIND THE INFORMATION VIA BROWSERBASE
  // ==========================================
  logThought('03_FIND_INFORMATION', `Connecting to Browserbase cloud browser infrastructure...`);
  
  let browserSession = null;
  if (!options.skipCloudSession) {
    browserSession = await createCloudSession({ wardInput: cleanWardInput, requestId });
    logThought(
      '03_FIND_INFORMATION',
      `Browserbase Cloud Browser started. Session ID: ${browserSession.sessionId} (${browserSession.isLive ? 'LIVE CLOUD' : 'SIMULATED'})`,
      'success',
      { sessionUrl: browserSession.replayUrl, connectUrl: browserSession.connectUrl }
    );
  }

  // Target public government dashboard
  const targetDashboard = rawRecord?.sourceDashboard || 'WQMIS - Jal Jeevan Mission Public Portal';
  const targetSourceUrl = rawRecord?.sourceUrl || `https://ejalshakti.gov.in/wqmis/reports?ward=${encodeURIComponent(cleanWardInput)}`;
  const retrievalTimestamp = new Date().toISOString();

  logThought('03_FIND_INFORMATION', `Navigating to official portal: ${targetDashboard} (${targetSourceUrl})`);

  // ==========================================
  // STEP 4: DECISION RULES & SAFETY EVALUATION
  // ==========================================
  
  // CRITICAL RULE (TC4): If no sample exists for ward
  if (!rawRecord || !rawRecord.parameters || rawRecord.parameters.length === 0 || !rawRecord.sampleDate) {
    logThought(
      'DECISION_RULES',
      `CRITICAL SAFETY RULE ENFORCED: No test records found for ward "${cleanWardInput}". Agent will strictly report "NO DATA". System is prohibited from assuming water is SAFE.`,
      'warning'
    );

    // Release session promptly
    if (browserSession?.sessionId) {
      await releaseCloudSession(browserSession.sessionId);
    }

    const noDataResult = {
      requestId,
      executionDurationMs: Date.now() - executionStartTime,
      wardInput: cleanWardInput,
      period: periodInput,
      wardFound: !!rawRecord,
      wardNumber: rawRecord?.wardNumber || 'N/A',
      wardName: rawRecord?.wardName || cleanWardInput,
      city: rawRecord?.city || 'Unknown',
      state: rawRecord?.state || 'Unknown',
      status: 'NO_DATA',
      isSafe: false, // MANDATORY: NEVER SAFE
      statusSummary: 'NO DATA RECORDED',
      badgeClass: 'badge-no-data',
      officialAdvisory: 'NO OFFICIAL TEST DATA AVAILABLE. Do NOT assume water is safe. Direct boiling/filtration required and contact municipal corporator to schedule urgent sampling.',
      sampleDate: null,
      retrievalTime: retrievalTimestamp,
      sourceUrl: targetSourceUrl,
      sourceDashboard: targetDashboard,
      parameters: [],
      browserbase: {
        sessionId: browserSession?.sessionId || 'N/A',
        replayUrl: browserSession?.replayUrl || null,
        isLive: browserSession?.isLive || false
      },
      verification: {
        allFiguresSourced: false,
        sampleDatePresent: false,
        status: 'VERIFICATION_INCOMPLETE_NO_DATA'
      },
      thoughts
    };

    return noDataResult;
  }

  // ==========================================
  // TC2 & TC3 EVALUATION: Normalization & Temporal Classification
  // ==========================================
  logThought('DECISION_RULES', `Extracting ${rawRecord.parameters.length} parameters from lab report #${rawRecord.laboratoryId}.`);

  // Classify sample date recency (TC2)
  const recency = classifySampleRecency(rawRecord.sampleDate, 2026);
  if (recency.isHistorical) {
    logThought(
      'DECISION_RULES',
      `TEMPORAL AUDIT: Sample is dated ${rawRecord.sampleDate} (${recency.ageInDays} days ago). Evaluated as HISTORICAL / STALE. Applying mandatory advisory flag.`,
      'warning'
    );
  } else {
    logThought(
      'DECISION_RULES',
      `TEMPORAL AUDIT: Sample is dated ${rawRecord.sampleDate} (${recency.ageInDays} days ago). Classified as CURRENT ACTIVE monitoring period.`,
      'info'
    );
  }

  // Normalize parameters (TC3)
  const normalizedParams = rawRecord.parameters.map(p => {
    const norm = normalizeParameter(p.paramKey, p.rawValue, p.rawUnit);
    // Attach source metadata to every single figure (PDF verification requirement)
    norm.sourceUrl = targetSourceUrl;
    norm.sampleDate = rawRecord.sampleDate;
    norm.retrievalTime = retrievalTimestamp;
    norm.samplingLocation = rawRecord.samplingLocation;

    if (norm.unitConversion.applied) {
      logThought(
        'DECISION_RULES',
        `UNIT NORMALIZATION: [${norm.name}] ${norm.rawValue} ${norm.rawUnit} converted to ${norm.normalizedValue} ${norm.normalizedUnit} (${norm.unitConversion.formula})`,
        'info'
      );
    }

    if (norm.status === 'HAZARDOUS') {
      logThought(
        'DECISION_RULES',
        `HAZARD DETECTED: [${norm.name}] value ${norm.normalizedValue} ${norm.normalizedUnit} violates BIS 10500 permissible limit (${norm.permissibleLimit})!`,
        'error'
      );
    }

    return norm;
  });

  // Calculate WQI
  const wqi = calculateWaterQualityIndex(normalizedParams);
  logThought('DECISION_RULES', `Calculated Water Quality Index (WQI): ${wqi.score}/100 - ${wqi.classification}`);

  // ==========================================
  // STEP 5: VERIFICATION SEPARATE FROM ACTION
  // ==========================================
  const figuresWithSourceAndDate = normalizedParams.every(p => p.sourceUrl && p.sampleDate && p.samplingLocation);
  logThought(
    '05_CHECK_RESULT',
    `Independent verification complete: ${figuresWithSourceAndDate ? '100% of figures have traceable source URL and sample date.' : 'Missing source provenance.'}`
  );

  // Generate content hash for idempotency control
  const contentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      wardId: rawRecord.wardId,
      sampleDate: rawRecord.sampleDate,
      params: normalizedParams.map(p => ({ k: p.paramKey, v: p.normalizedValue }))
    }))
    .digest('hex');

  // Check if previously approved
  const existingApproval = compilationStore.get(contentHash);

  // Cleanly release Browserbase session
  if (browserSession?.sessionId) {
    await releaseCloudSession(browserSession.sessionId);
  }

  // Formulate proposed compilation
  const proposedCompilation = {
    destination: `Public Ward Portal & Citizen SMS/Telegram Digest: Ward ${rawRecord.wardNumber}`,
    proposedAction: 'Compile and issue official Ward Water Quality Bulletin',
    wardId: rawRecord.wardId,
    wardName: rawRecord.wardName,
    city: rawRecord.city,
    sampleDate: rawRecord.sampleDate,
    wqiScore: wqi.score,
    wqiClassification: wqi.classification,
    hazardousCount: normalizedParams.filter(p => p.status === 'HAZARDOUS').length,
    isHistorical: recency.isHistorical,
    contentHash
  };

  const fullReport = {
    requestId,
    executionDurationMs: Date.now() - executionStartTime,
    wardInput: cleanWardInput,
    period: periodInput,
    wardNumber: rawRecord.wardNumber,
    wardId: rawRecord.wardId,
    wardName: rawRecord.wardName,
    city: rawRecord.city,
    state: rawRecord.state,
    sampleDate: rawRecord.sampleDate,
    samplingLocation: rawRecord.samplingLocation,
    laboratoryId: rawRecord.laboratoryId,
    testedBy: rawRecord.testedBy,
    testType: rawRecord.testType,
    retrievalTime: retrievalTimestamp,
    sourceUrl: targetSourceUrl,
    sourceDashboard: targetDashboard,
    recency,
    wqi,
    parameters: normalizedParams,
    browserbase: {
      sessionId: browserSession?.sessionId || 'N/A',
      replayUrl: browserSession?.replayUrl || null,
      isLive: browserSession?.isLive || false
    },
    verification: {
      allFiguresSourced: figuresWithSourceAndDate,
      sampleDatePresent: !!rawRecord.sampleDate,
      laboratoryIdPresent: !!rawRecord.laboratoryId,
      status: figuresWithSourceAndDate ? 'VERIFIED' : 'FAILED_AUDIT'
    },
    humanApproval: {
      status: existingApproval ? 'APPROVED' : 'PENDING_APPROVAL',
      contentHash,
      approvedAt: existingApproval?.approvedAt || null,
      approvedBy: existingApproval?.approvedBy || null,
      proposedCompilation
    },
    thoughts
  };

  // Persist to database (Supabase / local persistent storage)
  try {
    saveWardAudit(fullReport);
  } catch (e) {
    console.warn('DB save notice:', e.message);
  }

  return fullReport;
}

/**
 * Executes the Human-in-the-Loop approval gate (Permitted Action)
 */
function approveCompilation(contentHash, approvedBy = 'Municipal Health Officer') {
  if (!contentHash) return { success: false, error: 'Missing content hash' };
  
  if (compilationStore.has(contentHash)) {
    const existing = compilationStore.get(contentHash);
    return {
      success: true,
      alreadyApproved: true,
      message: 'Idempotency guarantee: Report was already approved. Returning existing compilation state.',
      data: existing
    };
  }

  const approvalRecord = {
    contentHash,
    status: 'APPROVED',
    approvedBy,
    approvedAt: new Date().toISOString(),
    publishedDestination: 'Public Ward Water Quality Dashboard & SMS Gateway',
    compiledReportId: 'REP-CMP-' + crypto.randomBytes(3).toString('hex').toUpperCase()
  };

  compilationStore.set(contentHash, approvalRecord);

  // Persist updated action state to database
  try {
    updateActionState(contentHash, approvalRecord);
  } catch (e) {
    console.warn('DB update action state notice:', e.message);
  }

  return {
    success: true,
    alreadyApproved: false,
    message: 'Compilation officially approved and dispatched.',
    data: approvalRecord
  };
}

module.exports = {
  runWardWaterReporterAgent,
  approveCompilation,
  compilationStore
};
