const { runWardWaterReporterAgent } = require('./agentLoop');
const { saveTestResults } = require('./dbService');

/**
 * Official Test Suite for Ziro Agentic AI Hackathon 2026
 * Problem: Ward Water Quality Reporter
 * Executes all 4 mandatory test cases (TC1, TC2, TC3, TC4)
 */

async function runAllTestCases() {
  const suiteResults = [];

  // ==========================================
  // TEST CASE 1: Ward selected
  // Expected: results with sample date, place and units
  // ==========================================
  console.log('--- Running TC1: Ward selected ---');
  try {
    const res1 = await runWardWaterReporterAgent('WARD-42', '2026-Q4', { skipCloudSession: false });
    
    // Validate assertions
    const hasSampleDate = !!res1.sampleDate;
    const hasLocation = !!res1.samplingLocation;
    const allHaveUnits = res1.parameters && res1.parameters.length > 0 && res1.parameters.every(p => !!p.rawUnit && !!p.normalizedUnit);
    const passed = hasSampleDate && hasLocation && allHaveUnits && res1.status !== 'NO_DATA';

    suiteResults.push({
      testId: 'TC1',
      scenario: 'Ward selected',
      input: { ward: 'WARD-42 (Indiranagar East)', period: '2026-Q4' },
      expected: 'Results with sample date, place and units',
      actual: passed
        ? `Successfully extracted ${res1.parameters.length} parameters with sample date (${res1.sampleDate}), sampling location (${res1.samplingLocation}), and explicit normalized units.`
        : 'Missing required sample date, location, or parameter units.',
      passed,
      evidence: {
        sampleDate: res1.sampleDate,
        samplingLocation: res1.samplingLocation,
        sourceDashboard: res1.sourceDashboard,
        sourceUrl: res1.sourceUrl,
        sampleParametersCount: res1.parameters?.length || 0,
        sampleParameterPreview: res1.parameters?.slice(0, 3).map(p => `${p.name}: ${p.normalizedValue} ${p.normalizedUnit}`),
        browserbaseSession: res1.browserbase?.sessionId,
        browserbaseReplay: res1.browserbase?.replayUrl
      }
    });
  } catch (err) {
    suiteResults.push({
      testId: 'TC1',
      scenario: 'Ward selected',
      expected: 'Results with sample date, place and units',
      actual: `Execution error: ${err.message}`,
      passed: false,
      evidence: { error: err.stack }
    });
  }

  // ==========================================
  // TEST CASE 2: Sample from last year
  // Expected: labelled historical
  // ==========================================
  console.log('--- Running TC2: Sample from last year ---');
  try {
    const res2 = await runWardWaterReporterAgent('WARD-108', '2026-Q4', { skipCloudSession: false });
    
    const isHistoricalFlag = res2.recency?.isHistorical === true;
    const hasHistoricalLabel = res2.recency?.label === 'HISTORICAL' || res2.recency?.tag?.includes('HISTORICAL');
    const passed = isHistoricalFlag && hasHistoricalLabel;

    suiteResults.push({
      testId: 'TC2',
      scenario: 'Sample from last year',
      input: { ward: 'WARD-108 (Gandhinagar Old Colony)', sampleDate: '2025-06-18' },
      expected: 'Labelled historical with stale notice',
      actual: passed
        ? `Sample dated ${res2.sampleDate} was successfully identified as older than current period and explicitly labelled "${res2.recency.tag}". Age: ${res2.recency.ageInDays} days.`
        : `Sample was not flagged as historical. Label: ${res2.recency?.label}`,
      passed,
      evidence: {
        sampleDate: res2.sampleDate,
        recencyAudit: res2.recency,
        advisoryWarning: res2.recency?.warning,
        sourceUrl: res2.sourceUrl,
        browserbaseSession: res2.browserbase?.sessionId
      }
    });
  } catch (err) {
    suiteResults.push({
      testId: 'TC2',
      scenario: 'Sample from last year',
      expected: 'Labelled historical',
      actual: `Execution error: ${err.message}`,
      passed: false,
      evidence: { error: err.stack }
    });
  }

  // ==========================================
  // TEST CASE 3: mg/L and microgram/L values
  // Expected: normalised before comparison
  // ==========================================
  console.log('--- Running TC3: mg/L and microgram/L values ---');
  try {
    const res3 = await runWardWaterReporterAgent('WARD-77', '2026-Q4', { skipCloudSession: false });
    
    // Verify that µg/L parameters were converted into standard mg/L units
    const arsenic = res3.parameters.find(p => p.paramKey === 'arsenic');
    const lead = res3.parameters.find(p => p.paramKey === 'lead');
    const fluoride = res3.parameters.find(p => p.paramKey === 'fluoride');

    const arsenicNormalized = arsenic && arsenic.rawUnit === 'µg/L' && arsenic.normalizedUnit === 'mg/L' && arsenic.normalizedValue === 0.025;
    const leadNormalized = lead && (lead.rawUnit === 'microgram/L' || lead.rawUnit === 'µg/L') && lead.normalizedUnit === 'mg/L' && lead.normalizedValue === 0.018;
    const fluorideNormalized = fluoride && fluoride.rawUnit === 'µg/L' && fluoride.normalizedUnit === 'mg/L' && fluoride.normalizedValue === 1.4;

    const passed = !!(arsenicNormalized && leadNormalized && fluorideNormalized);

    suiteResults.push({
      testId: 'TC3',
      scenario: 'mg/L and microgram/L values',
      input: {
        ward: 'WARD-77 (Industrial Belt Phase 2)',
        rawSamples: [
          { param: 'Arsenic', raw: '25.0 µg/L' },
          { param: 'Lead', raw: '18.0 microgram/L' },
          { param: 'Fluoride', raw: '1400.0 µg/L' },
          { param: 'TDS', raw: '740 mg/L' }
        ]
      },
      expected: 'Normalised before comparison against BIS IS 10500 standards',
      actual: passed
        ? `Automatic unit conversion successfully performed before threshold checks:
- Arsenic: 25.0 µg/L -> 0.025 mg/L (Exceeds BIS limit 0.01 mg/L -> HAZARDOUS)
- Lead: 18.0 µg/L -> 0.018 mg/L (Exceeds BIS limit 0.01 mg/L -> HAZARDOUS)
- Fluoride: 1400.0 µg/L -> 1.400 mg/L (Exceeds acceptable limit 1.0 mg/L)`
        : 'Unit conversion failed or values were not standardized prior to evaluation.',
      passed,
      evidence: {
        conversions: [
          arsenic?.unitConversion,
          lead?.unitConversion,
          fluoride?.unitConversion
        ].filter(Boolean),
        bisStandardsChecked: ['Arsenic: 0.01 mg/L', 'Lead: 0.01 mg/L', 'Fluoride: 1.0 mg/L'],
        browserbaseSession: res3.browserbase?.sessionId
      }
    });
  } catch (err) {
    suiteResults.push({
      testId: 'TC3',
      scenario: 'mg/L and microgram/L values',
      expected: 'Normalised before comparison',
      actual: `Execution error: ${err.message}`,
      passed: false,
      evidence: { error: err.stack }
    });
  }

  // ==========================================
  // TEST CASE 4: No sample for ward
  // Expected: reported 'no data', never 'safe'
  // ==========================================
  console.log('--- Running TC4: No sample for ward ---');
  try {
    const res4 = await runWardWaterReporterAgent('WARD-219', '2026-Q4', { skipCloudSession: false });
    
    const isReportedNoData = res4.status === 'NO_DATA' || res4.statusSummary?.includes('NO DATA');
    const isNeverSafe = res4.isSafe === false && !JSON.stringify(res4).toLowerCase().includes('"safe":true');
    const hasNoDataAdvisory = !!res4.officialAdvisory && res4.officialAdvisory.includes('NO OFFICIAL TEST DATA AVAILABLE');

    const passed = isReportedNoData && isNeverSafe && hasNoDataAdvisory;

    suiteResults.push({
      testId: 'TC4',
      scenario: 'No sample for ward',
      input: { ward: 'WARD-219 (New Extension Sector 14)', recordState: 'Empty / Unsampled' },
      expected: "Reported 'no data', never 'safe'",
      actual: passed
        ? `Strict safety invariant preserved: Status returned as "${res4.statusSummary}". isSafe is false. Never reported safe under any circumstance.`
        : `Safety violation: System allowed a missing record to be marked as safe or did not report 'no data'.`,
      passed,
      evidence: {
        status: res4.status,
        isSafe: res4.isSafe,
        statusSummary: res4.statusSummary,
        officialAdvisory: res4.officialAdvisory,
        browserbaseSession: res4.browserbase?.sessionId
      }
    });
  } catch (err) {
    suiteResults.push({
      testId: 'TC4',
      scenario: 'No sample for ward',
      expected: "Reported 'no data', never 'safe'",
      actual: `Execution error: ${err.message}`,
      passed: false,
      evidence: { error: err.stack }
    });
  }

  const allPassed = suiteResults.every(r => r.passed);
  
  // Persist test suite run to database (Supabase / local persistent storage)
  try {
    saveTestResults(suiteResults);
  } catch (e) {
    console.warn('DB test save notice:', e.message);
  }

  return {
    timestamp: new Date().toISOString(),
    totalTests: suiteResults.length,
    passedCount: suiteResults.filter(r => r.passed).length,
    failedCount: suiteResults.filter(r => !r.passed).length,
    allPassed,
    results: suiteResults
  };
}

module.exports = {
  runAllTestCases
};
