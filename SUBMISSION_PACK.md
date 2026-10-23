# 📋 Ziro Hackathon Official Submission Pack
### Team: CodeCatalyst | Problem: Ward Water Quality Reporter
*Participant: Dhayananth N (`dhayananth1511@gmail.com`) & Abishek M*

Use the exact formatted sections below to fill out your **Build & Submit** form on the official Ziro hackathon participant dashboard.

---

### 1. Project Name *
```text
AquaWard AI - Autonomous Ward Water Quality Reporter
```

---

### 2. Tools Used *
```text
Browserbase Cloud Browser, Node.js, Express, Playwright/Fetch API, BIS IS 10500:2012 Engine, Cryptographic Idempotency Hash (SHA-256)
```

---

### 3. Demo URL *
```text
http://localhost:3000
```
*(If deploying publicly for the judges, run `ngrok http 3000` or deploy to Render/Vercel and paste your public link here).*

---

### 4. 2–3 Min Demo Video URL *
*(Upload your screen recording of the app and test suite to YouTube / Loom / Google Drive and paste the public link here).*

**Demo Video Script (What to say during your 2–3 minute video):**
1. **0:00 - 0:30 (Problem & Objective)**:
   > "Hello judges! We are Team CodeCatalyst, and this is AquaWard AI, our autonomous agent built for Bharat under the Social Impact & Sustainability track. Residents in India often cannot decipher complex government water quality test results or don't know if their drinking water is safe."
2. **0:30 - 1:15 (Live Agent & Browserbase Demonstration)**:
   > "Here we select Ward 77 (Industrial Belt Phase 2). When we launch the agent, it creates a live cloud browser session on Browserbase in the ap-southeast-1 region. It navigates to the public water dashboard, extracts the official laboratory assay, and displays real-time agent thoughts in the console."
3. **1:15 - 1:50 (Unit Normalization & Safety Gates)**:
   > "Notice how our normalization engine automatically converts Arsenic (25 µg/L) and Lead (18 µg/L) into standard mg/L, immediately identifying that they breach the Bureau of Indian Standards (BIS IS 10500:2012) thresholds, giving a WQI score of 42. Crucially, before anything is compiled, our Human-in-the-Loop Permitted Action Gate pauses the pipeline, asking for reviewer authorization with an idempotent SHA-256 hash."
4. **1:50 - 2:30 (Official Test Suite Verification - TC1 to TC4)**:
   > "Finally, let's open our automated Hackathon Test Suite. In one click, we run all 4 mandatory scenarios: TC1 verifies ward selection with date, place, and units; TC2 flags last year's sample as historical; TC3 normalizes mixed microgram and milligram units; and TC4 strictly reports 'NO DATA' and never 'SAFE' for unsampled wards. All 4 tests pass with 100% evidence verification."

---

### 5. Agent Architecture *
```text
AquaWard AI implements an autonomous 6-stage agentic loop designed around Browserbase cloud infrastructure:

1. Input Ingestion & Validation: Captures Ward ID and Audit Period, validating stable identifiers before execution.
2. Step Planner & Policy Engine: Deconstructs the audit into discrete operations: Browserbase session provisioning, portal navigation, parameter extraction, and BIS 10500 compliance checking.
3. Browserbase Cloud Agent: Spins up headless cloud browsers in the ap-southeast-1 region to scrape and parse public government dashboards (WQMIS / Jal Jeevan Mission, CPCB, and Municipal Water Boards), capturing source URLs, retrieval timestamps, and session replay recordings.
4. Metric Normalization & Temporal Audit: Normalizes disparate units (µg/L, ppb, ppm to mg/L) and audits sample recency against reference dates to flag historical or stale samples (>180 days old).
5. Human-in-the-Loop Permitted Action Gate: Enforces the mandatory permission step before compiling or publishing reports. Displays the proposed diff, destination, and idempotent cryptographic hash (SHA-256) to prevent duplicate runs.
6. Independent Verification & Delivery: Verifies that 100% of figures have proven source provenance and date before rendering the citizen report card and printable water certificate.
```

---

### 6. Test Cases / Proof of Working Agent *
```text
All 4 mandatory hackathon test cases were automated and verified with 100% pass rate:

1. TC1 (Ward Selected):
   - Input: Ward 42 (Indiranagar East), Period: 2026-Q4
   - Expected: Results with sample date, place, and units.
   - Result: PASS. Extracted 7 parameters, sample date (2026-10-12), sampling location (Indiranagar Main Sump Tap #04), and normalized units. Traceable to laboratory ID KSPCB-LAB-BNG-8821.

2. TC2 (Sample from last year):
   - Input: Ward 108 (Gandhinagar Old Colony), Sample Date: 2025-06-18
   - Expected: Labelled historical.
   - Result: PASS. Automatically flagged as HISTORICAL (STALE - 492 days old), generating an alert that municipal water conditions may have altered and re-testing is mandatory.

3. TC3 (mg/L and microgram/L values):
   - Input: Ward 77 (Industrial Belt Phase 2)
   - Expected: Normalised before comparison.
   - Result: PASS. Arsenic (25.0 µg/L) normalized to 0.025 mg/L (flagged hazardous vs 0.01 mg/L BIS limit). Lead (18.0 µg/L) normalized to 0.018 mg/L. Fluoride (1400.0 µg/L) normalized to 1.4 mg/L.

4. TC4 (No sample for ward):
   - Input: Ward 219 (New Extension Sector 14)
   - Expected: Reported 'no data', never 'safe'.
   - Result: PASS. Strict invariant enforced. Returned status 'NO DATA RECORDED'; isSafe flag is strictly FALSE; never reported safe.
```

---

### 7. Solution & Agent Workflow *
```text
AquaWard AI bridges the critical gap between raw public water quality databases and citizen safety in Bharat. By integrating Browserbase's scalable cloud browser infrastructure, the agent accesses real-time government water surveillance portals without requiring fragile client scrapers. 

The workflow systematically executes:
1. Citizen/Municipal ward selection.
2. Cloud browser orchestration on Browserbase.
3. Deep extraction of chemical, physical, and microbiological data.
4. BIS IS 10500:2012 mathematical normalization and Water Quality Index (WQI) scoring.
5. Invariant enforcement ensuring unsampled wards are never marked safe.
6. Human-in-the-loop review and cryptographic sealing before public advisory distribution.
```

---

### 8. LinkedIn Post Copy (Mandatory Requirement) *
*(Copy and paste this into LinkedIn, tag `@Ziro Digital`, attach a screenshot of the AquaWard AI dashboard or test suite, and paste your post link in the hackathon form)*:

```text
🚀 Excited to unveil AquaWard AI — our submission for the Ziro Agentic AI Hackathon 2026: Agents for Bharat! 🇮🇳💧

Access to clean, safe drinking water is a fundamental right, yet water quality records across municipal wards in Bharat often remain trapped in fragmented portals with confusing units (µg/L vs mg/L) or outdated data.

Together with my team CodeCatalyst, we built AquaWard AI: an autonomous agent powered by @Browserbase cloud browsers and Bureau of Indian Standards (BIS IS 10500:2012) intelligence!

Key highlights of our agent:
✅ Autonomous Web Exploration: Connects to public water portals via Browserbase cloud browsers in ap-southeast-1.
✅ Intelligent Normalization: Standardizes µg/L, ppb, and ppm to mg/L for instant BIS safety audits.
✅ Temporal Recency Auditing: Flags historical samples from previous years as stale.
✅ Safety Invariants: Missing ward data is strictly reported as 'NO DATA' — NEVER assumed safe!
✅ Human-in-the-Loop Action Gate: Requires reviewer sign-off with cryptographic SHA-256 idempotency before publishing official bulletins.
✅ 100% Pass Rate on all 4 official hackathon test cases (TC1–TC4)!

Big thanks to @Ziro Digital for organizing this incredible hackathon and empowering builders to create AI agents that make a real difference for Bharat! 💡

#ZiroHackathon #AgenticAI #Browserbase #AgentsForBharat #AIForGood #Sustainability #WaterSafety #CodeCatalyst
```
