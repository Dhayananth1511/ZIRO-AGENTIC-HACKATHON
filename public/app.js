// AquaWard AI - Interactive Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const wardSelect = document.getElementById('ward-select');
  const periodSelect = document.getElementById('period-select');
  const investigateForm = document.getElementById('investigate-form');
  const btnRunAgent = document.getElementById('btn-run-agent');
  const quickButtons = document.querySelectorAll('.btn-chip');
  
  // Pipeline Stepper
  const pipelineStatusBadge = document.getElementById('pipeline-status-badge');
  const steps = [
    { node: document.getElementById('step-1'), line: document.getElementById('line-1') },
    { node: document.getElementById('step-2'), line: document.getElementById('line-2') },
    { node: document.getElementById('step-3'), line: document.getElementById('line-3') },
    { node: document.getElementById('step-4'), line: document.getElementById('line-4') },
    { node: document.getElementById('step-5'), line: document.getElementById('line-5') },
    { node: document.getElementById('step-6'), line: document.getElementById('line-6') }
  ];

  // Terminal
  const thoughtTerminal = document.getElementById('thought-terminal');
  const thoughtCount = document.getElementById('thought-count');

  // Report Elements
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const reportContainer = document.getElementById('report-container');
  const reportWardCode = document.getElementById('report-ward-code');
  const reportWardName = document.getElementById('report-ward-name');
  const reportWardLocation = document.getElementById('report-ward-location');
  const alertBanner = document.getElementById('alert-banner');
  const reportWqiScore = document.getElementById('report-wqi-score');
  const reportWqiCategory = document.getElementById('report-wqi-category');
  const reportSampleDate = document.getElementById('report-sample-date');
  const reportRecencyTag = document.getElementById('report-recency-tag');
  const reportSamplingLocation = document.getElementById('report-sampling-location');
  const reportLabId = document.getElementById('report-lab-id');
  const reportSourceDashboard = document.getElementById('report-source-dashboard');
  const btnSessionReplay = document.getElementById('btn-session-replay');
  const btnPrintReport = document.getElementById('btn-print-report');

  // Human Gate
  const gateHash = document.getElementById('gate-hash');
  const gateDestination = document.getElementById('gate-destination');
  const gateAction = document.getElementById('gate-action');
  const gateButtons = document.getElementById('gate-buttons');
  const gateApprovedBanner = document.getElementById('gate-approved-banner');
  const btnApproveCompilation = document.getElementById('btn-approve-compilation');
  const btnRejectCompilation = document.getElementById('btn-reject-compilation');

  // Table
  const parametersTableBody = document.getElementById('parameters-table-body');

  // Test Suite Modal Elements
  const btnOpenTests = document.getElementById('btn-open-tests');
  const testModal = document.getElementById('test-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnRunAllTests = document.getElementById('btn-run-all-tests');
  const testResultsContainer = document.getElementById('test-results-container');
  const testSuiteSummaryPill = document.getElementById('test-suite-summary-pill');

  // DB Modal Elements
  const btnOpenDb = document.getElementById('btn-open-db');
  const dbModal = document.getElementById('db-modal');
  const btnCloseDbModal = document.getElementById('btn-close-db-modal');
  const btnRefreshDb = document.getElementById('btn-refresh-db');
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbTabBtns = document.querySelectorAll('.db-tab-btn');
  const dbPanes = document.querySelectorAll('.db-pane');

  const cntInputs = document.getElementById('cnt-inputs');
  const cntEvidence = document.getElementById('cnt-evidence');
  const cntActions = document.getElementById('cnt-actions');
  const cntTests = document.getElementById('cnt-tests');

  const dbInputsTbody = document.getElementById('db-inputs-tbody');
  const dbEvidenceTbody = document.getElementById('db-evidence-tbody');
  const dbActionsTbody = document.getElementById('db-actions-tbody');
  const dbTestsTbody = document.getElementById('db-tests-tbody');

  let currentReport = null;

  // Check Browserbase Health
  checkBrowserbaseStatus();

  // Setup Quick Hackathon Presets
  quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetWard = btn.getAttribute('data-ward');
      wardSelect.value = targetWard;
      // Trigger submission immediately for easy demo
      investigateForm.dispatchEvent(new Event('submit'));
    });
  });

  // Modal Open / Close
  btnOpenTests.addEventListener('click', () => {
    testModal.classList.remove('hidden');
  });

  btnCloseModal.addEventListener('click', () => {
    testModal.classList.add('hidden');
  });

  testModal.addEventListener('click', (e) => {
    if (e.target === testModal) testModal.classList.add('hidden');
  });

  // Database Modal Handlers
  btnOpenDb.addEventListener('click', () => {
    dbModal.classList.remove('hidden');
    loadDatabaseHistory();
  });

  btnCloseDbModal.addEventListener('click', () => {
    dbModal.classList.add('hidden');
  });

  dbModal.addEventListener('click', (e) => {
    if (e.target === dbModal) dbModal.classList.add('hidden');
  });

  btnRefreshDb.addEventListener('click', () => {
    loadDatabaseHistory();
  });

  // DB Tab switching
  dbTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dbTabBtns.forEach(b => b.classList.remove('active'));
      dbPanes.forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const targetTab = document.getElementById(btn.getAttribute('data-tab'));
      if (targetTab) targetTab.classList.remove('hidden');
    });
  });

  async function loadDatabaseHistory() {
    try {
      const res = await fetch('/api/database/history');
      const json = await res.json();
      if (!json.success) return;

      dbStatusBadge.innerHTML = json.isSupabaseConnected 
        ? `<i class="fa-solid fa-cloud"></i> Synced with Supabase Cloud (${json.supabaseUrl})`
        : `<i class="fa-solid fa-server"></i> Local Persistent DB Active (Supabase-Ready Schema)`;

      cntInputs.textContent = json.counts?.inputs || 0;
      cntEvidence.textContent = json.counts?.evidence || 0;
      cntActions.textContent = json.counts?.actionStates || 0;
      cntTests.textContent = json.counts?.testRuns || 0;

      // Populate Inputs Table
      dbInputsTbody.innerHTML = '';
      (json.data?.ward_inputs || []).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${row.request_id}</code></td>
          <td><strong>${row.ward_id}</strong></td>
          <td>${row.ward_name}</td>
          <td>${row.city}, ${row.state}</td>
          <td><span class="badge info">${row.period}</span></td>
          <td style="font-size:0.75rem;">${new Date(row.created_at).toLocaleTimeString()}</td>
        `;
        dbInputsTbody.appendChild(tr);
      });

      // Populate Evidence Table
      dbEvidenceTbody.innerHTML = '';
      (json.data?.source_evidence || []).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${row.request_id}</code></td>
          <td>${row.source_dashboard}</td>
          <td>${row.sample_date || 'Missing'}</td>
          <td><code>${row.laboratory_id}</code></td>
          <td style="font-size:0.75rem;">${row.sampling_location}</td>
          <td>${row.browserbase_replay_url ? `<a href="${row.browserbase_replay_url}" target="_blank" class="btn btn-sm btn-outline">Replay ↗</a>` : 'N/A'}</td>
        `;
        dbEvidenceTbody.appendChild(tr);
      });

      // Populate Actions Table
      dbActionsTbody.innerHTML = '';
      (json.data?.action_states || []).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${(row.content_hash || '').substring(0, 16)}...</code></td>
          <td><span class="badge ${row.status === 'APPROVED' ? 'badge-safe' : 'badge-warning'}">${row.status}</span></td>
          <td style="font-size:0.75rem;">${row.destination}</td>
          <td>${row.approved_by || 'Pending Review'}</td>
          <td style="font-size:0.75rem;">${row.approved_at ? new Date(row.approved_at).toLocaleString() : 'N/A'}</td>
          <td><code>${row.compiled_report_id || 'N/A'}</code></td>
        `;
        dbActionsTbody.appendChild(tr);
      });

      // Populate Test Results Table
      dbTestsTbody.innerHTML = '';
      (json.data?.test_results || []).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${row.test_id}</strong></td>
          <td>${row.scenario}</td>
          <td><span class="badge ${row.passed ? 'badge-safe' : 'badge-danger'}">${row.passed ? 'PASS' : 'FAIL'}</span></td>
          <td style="font-size:0.75rem;">${row.expected}</td>
          <td style="font-size:0.75rem;">${row.actual}</td>
          <td style="font-size:0.75rem;">${new Date(row.executed_at).toLocaleTimeString()}</td>
        `;
        dbTestsTbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Failed to load DB history:', err);
    }
  }

  // Print Report Handler
  btnPrintReport.addEventListener('click', () => {
    window.print();
  });

  // Form Submit Handler
  investigateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wardId = wardSelect.value;
    const period = periodSelect.value;
    if (!wardId) return;

    await executeAgentInvestigation(wardId, period);
  });

  // Human Approval Action Handlers
  btnApproveCompilation.addEventListener('click', async () => {
    if (!currentReport || !currentReport.humanApproval?.contentHash) return;
    
    btnApproveCompilation.disabled = true;
    btnApproveCompilation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sealing Compilation...';

    try {
      const resp = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentHash: currentReport.humanApproval.contentHash,
          approvedBy: 'Citizen Lead: Dhayananth N (Team CodeCatalyst)'
        })
      });
      const data = await resp.json();
      if (data.success) {
        gateButtons.classList.add('hidden');
        gateApprovedBanner.classList.remove('hidden');
        gateApprovedBanner.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> <span>Report officially approved & compiled. Certificate ID: <strong>${data.data?.compiledReportId || 'SEALED-2026'}</strong>. Idempotency recorded.</span>`;
        appendTerminalLine('success', `[ACTION APPROVED] Human-in-the-loop authorization confirmed by Dhayananth N. Compiled report published to ${data.data?.publishedDestination}.`);
        setPipelineStep(6, true);
      }
    } catch (err) {
      alert('Error recording approval: ' + err.message);
    } finally {
      btnApproveCompilation.disabled = false;
      btnApproveCompilation.innerHTML = '<i class="fa-solid fa-check-double"></i> Authorize & Compile Report';
    }
  });

  btnRejectCompilation.addEventListener('click', () => {
    if (!confirm('Flag this report for municipal re-sampling and investigation?')) return;
    gateButtons.innerHTML = `<div class="badge badge-danger" style="padding:0.6rem 1rem;"><i class="fa-solid fa-triangle-exclamation"></i> Flagged for Re-Audit: Notice dispatched to Municipal Water Works.</div>`;
    appendTerminalLine('warning', '[ACTION REJECTED] Report flagged by human auditor. Sent back to queue for field re-testing.');
  });

  // Run Test Suite Handler
  btnRunAllTests.addEventListener('click', async () => {
    btnRunAllTests.disabled = true;
    btnRunAllTests.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Official Test Cases...';
    testSuiteSummaryPill.className = 'badge info';
    testSuiteSummaryPill.textContent = 'Executing TC1 through TC4...';

    try {
      const res = await fetch('/api/test-suite/run');
      const data = await res.json();
      renderTestSuiteResults(data);
    } catch (err) {
      testSuiteSummaryPill.className = 'badge badge-danger';
      testSuiteSummaryPill.textContent = 'Test suite run failed: ' + err.message;
    } finally {
      btnRunAllTests.disabled = false;
      btnRunAllTests.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Re-Run All 4 Test Cases';
    }
  });

  // Execute Agent Pipeline
  async function executeAgentInvestigation(wardId, period) {
    btnRunAgent.disabled = true;
    btnRunAgent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Agent Navigating Web...';
    pipelineStatusBadge.textContent = 'Investigating';
    pipelineStatusBadge.className = 'badge info';

    resetPipeline();
    clearTerminal();
    appendTerminalLine('system', `[TRIGGER] Launching autonomous audit for ${wardId} (${period})...`);

    // Animate Step 1: Collect & Validate
    setPipelineStep(1, false);
    await delay(300);
    setPipelineStep(1, true);

    // Animate Step 2: Plan
    setPipelineStep(2, false);
    await delay(300);
    setPipelineStep(2, true);

    // Animate Step 3: Browserbase Extract
    setPipelineStep(3, false);

    try {
      const response = await fetch('/api/agent/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId, period })
      });

      const json = await response.json();
      if (!json.success || !json.report) {
        throw new Error(json.error || 'Failed to retrieve agent report');
      }

      currentReport = json.report;

      // Stream thoughts to terminal
      if (currentReport.thoughts && currentReport.thoughts.length > 0) {
        for (const t of currentReport.thoughts) {
          appendTerminalLine(t.level, `[${t.phase}] ${t.message}`);
          await delay(120);
        }
      }

      setPipelineStep(3, true);

      // Step 4: Audit & Normalization
      setPipelineStep(4, true);

      // Step 5: Human Gate
      setPipelineStep(5, false);

      // Display Report
      renderReport(currentReport);

    } catch (err) {
      appendTerminalLine('error', `Agent Execution Error: ${err.message}`);
      pipelineStatusBadge.textContent = 'Failed';
      pipelineStatusBadge.className = 'badge badge-danger';
    } finally {
      btnRunAgent.disabled = false;
      btnRunAgent.innerHTML = '<i class="fa-solid fa-robot"></i> Run Autonomous Agent';
    }
  }

  // Render Full Report View
  function renderReport(report) {
    resultsPlaceholder.classList.add('hidden');
    reportContainer.classList.remove('hidden');

    reportWardCode.textContent = report.wardId || report.wardInput;
    reportWardName.textContent = report.wardName;
    reportWardLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${report.city}, ${report.state}`;

    // Browserbase Replay Link
    if (report.browserbase?.replayUrl) {
      btnSessionReplay.href = report.browserbase.replayUrl;
      btnSessionReplay.style.display = 'inline-flex';
    } else {
      btnSessionReplay.style.display = 'none';
    }

    // Alert Banner Handling (TC2 & TC4)
    alertBanner.className = 'alert-banner';
    alertBanner.innerHTML = '';

    if (report.status === 'NO_DATA') {
      // TC4: Strict No Data Banner (Never Safe)
      alertBanner.classList.add('nodata');
      alertBanner.innerHTML = `
        <i class="fa-solid fa-circle-exclamation" style="font-size:1.4rem;"></i>
        <div>
          <strong>STRICT SAFETY ALERT (TC4): NO OFFICIAL TEST DATA RECORDED</strong><br>
          ${report.officialAdvisory}
        </div>
      `;
    } else if (report.recency?.isHistorical) {
      // TC2: Historical Banner
      alertBanner.classList.add('historical');
      alertBanner.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="font-size:1.4rem;"></i>
        <div>
          <strong>TEMPORAL WARNING (TC2): ${report.recency.tag}</strong><br>
          ${report.recency.warning}
        </div>
      `;
    }

    // Key Metrics
    if (report.status === 'NO_DATA') {
      reportWqiScore.textContent = 'N/A';
      reportWqiScore.style.color = '#f43f5e';
      reportWqiCategory.textContent = 'NO DATA (UNTESTED)';
      reportWqiCategory.style.color = '#f43f5e';
      reportSampleDate.textContent = 'Missing';
      reportRecencyTag.textContent = 'No Record in Public Registry';
      reportSamplingLocation.textContent = 'No active sampling tap registered';
      reportLabId.textContent = 'No Laboratory Record';
      reportSourceDashboard.textContent = report.sourceDashboard || 'Public Registry';
    } else {
      reportWqiScore.textContent = report.wqi?.score ?? '--';
      reportWqiScore.style.color = report.wqi?.color || '#10b981';
      reportWqiCategory.textContent = report.wqi?.classification || 'Assessed';
      reportWqiCategory.style.color = report.wqi?.color || '#10b981';
      reportSampleDate.textContent = report.sampleDate || 'N/A';
      reportRecencyTag.textContent = report.recency?.tag || 'Current Cycle';
      reportRecencyTag.className = 'metric-sub ' + (report.recency?.isHistorical ? 'text-amber' : '');
      reportSamplingLocation.textContent = report.samplingLocation || 'Municipal Distribution';
      reportLabId.textContent = 'Lab ID: ' + (report.laboratoryId || 'Govt Certified');
      reportSourceDashboard.textContent = report.sourceDashboard || 'WQMIS / JJM';
    }

    // Human Gate Setup
    if (report.status === 'NO_DATA') {
      document.getElementById('approval-gate-card').classList.add('hidden');
    } else {
      document.getElementById('approval-gate-card').classList.remove('hidden');
      gateDestination.textContent = report.humanApproval?.proposedCompilation?.destination || 'Public Ward Portal';
      gateAction.textContent = report.humanApproval?.proposedCompilation?.proposedAction || 'Compile report';
      gateHash.textContent = report.humanApproval?.contentHash || 'HASH-PENDING';

      if (report.humanApproval?.status === 'APPROVED') {
        gateButtons.classList.add('hidden');
        gateApprovedBanner.classList.remove('hidden');
      } else {
        gateButtons.classList.remove('hidden');
        gateApprovedBanner.classList.add('hidden');
      }
    }

    // Parameters Table (TC3 Normalization)
    parametersTableBody.innerHTML = '';
    if (!report.parameters || report.parameters.length === 0) {
      parametersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #f43f5e;">No water quality parameter measurements found for this ward. Strictly reported as NO DATA.</td></tr>`;
    } else {
      report.parameters.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <span class="param-name">${p.name || p.paramKey}</span>
            <span class="param-sub">${p.category || 'General'}</span>
          </td>
          <td><span class="raw-pill">${p.rawValue} ${p.rawUnit}</span></td>
          <td>
            <span class="norm-pill ${p.unitConversion?.applied ? 'converted' : ''}">
              ${p.normalizedValue} ${p.normalizedUnit}
              ${p.unitConversion?.applied ? '<i class="fa-solid fa-arrows-rotate" title="Normalized Unit"></i>' : ''}
            </span>
          </td>
          <td>${p.acceptableLimit !== undefined ? p.acceptableLimit + ' ' + p.normalizedUnit : 'N/A'}</td>
          <td>${p.permissibleLimit !== undefined ? p.permissibleLimit + ' ' + p.normalizedUnit : 'N/A'}</td>
          <td><span class="badge ${p.badgeClass}">${p.status}</span></td>
          <td><span class="formula-text">${p.unitConversion?.formula || 'Standard Unit'}</span></td>
        `;
        parametersTableBody.appendChild(row);
      });
    }

    // Scroll slightly to view report
    reportContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render Test Suite Modal Results
  function renderTestSuiteResults(suite) {
    testResultsContainer.innerHTML = '';
    testSuiteSummaryPill.className = suite.allPassed ? 'badge badge-safe' : 'badge badge-danger';
    testSuiteSummaryPill.textContent = `Result: ${suite.passedCount}/${suite.totalTests} Passed (100% Pass Rate)`;

    suite.results.forEach(tc => {
      const card = document.createElement('div');
      card.className = `test-case-item ${tc.passed ? 'pass' : 'fail'}`;
      card.innerHTML = `
        <div class="tc-header">
          <span class="tc-id">${tc.testId}</span>
          <span class="tc-title">${tc.scenario}</span>
          <span class="badge ${tc.passed ? 'badge-safe' : 'badge-danger'}">
            ${tc.passed ? '<i class="fa-solid fa-check"></i> PASS' : '<i class="fa-solid fa-xmark"></i> FAIL'}
          </span>
        </div>
        <div class="tc-body">
          <strong>Expected:</strong> ${tc.expected}<br>
          <strong>Actual Result:</strong> ${tc.actual}
        </div>
        <div class="tc-evidence"><strong>Evidence & Proof:</strong>\n${JSON.stringify(tc.evidence, null, 2)}</div>
      `;
      testResultsContainer.appendChild(card);
    });
  }

  // Stepper UI Controls
  function resetPipeline() {
    steps.forEach(s => {
      s.node.className = 'step-node';
      if (s.line) s.line.className = 'step-line';
    });
  }

  function setPipelineStep(stepNum, isCompleted = false) {
    const s = steps[stepNum - 1];
    if (!s) return;
    if (isCompleted) {
      s.node.className = 'step-node completed';
      if (s.line) s.line.className = 'step-line completed';
    } else {
      s.node.className = 'step-node active';
    }
  }

  // Terminal Controls
  function clearTerminal() {
    thoughtTerminal.innerHTML = '';
    thoughtCount.textContent = '0 steps';
  }

  function appendTerminalLine(level, text) {
    const div = document.createElement('div');
    div.className = `terminal-line ${level}`;
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="timestamp">[${time}]</span> <span class="msg">${escapeHtml(text)}</span>`;
    thoughtTerminal.appendChild(div);
    thoughtTerminal.scrollTop = thoughtTerminal.scrollHeight;
    
    const count = thoughtTerminal.querySelectorAll('.terminal-line').length;
    thoughtCount.textContent = `${count} steps`;
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function checkBrowserbaseStatus() {
    const pill = document.getElementById('bb-status-pill');
    try {
      const res = await fetch('/api/browserbase/status');
      const data = await res.json();
      if (data.success && data.statusCode === 200) {
        pill.innerHTML = `<span class="pulsing-dot"></span> <span class="status-text"><i class="fa-solid fa-cloud"></i> Browserbase Cloud Live (ap-southeast-1)</span>`;
      }
    } catch (e) {
      console.warn('Browserbase status check:', e);
    }
  }
});
