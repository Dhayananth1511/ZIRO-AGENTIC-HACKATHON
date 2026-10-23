# 🌊 AquaWard AI — Ward Water Quality Reporter
### *Ziro Agentic AI Hackathon 2026 · Agents for Bharat*
**Track:** Social Impact & Sustainability AI  
**Team:** CodeCatalyst (`Dhayananth N` & `Abishek M`)  
**Powered By:** Browserbase Cloud Infrastructure & Bureau of Indian Standards (BIS IS 10500:2012)

---

## 🏆 Project Overview
**AquaWard AI** is an autonomous agentic system built to solve one of Bharat's most vital public health challenges: **transparent, ward-level drinking water quality monitoring**.

In most Indian cities and rural wards, water quality testing records from municipal corporations and public dashboards (such as WQMIS / Jal Jeevan Mission and CPCB) are fragmented, presented in incompatible units ($\mu\text{g/L}$ vs $\text{mg/L}$), or outdated.

AquaWard AI deploys an **autonomous agentic action loop** with:
1. **Live Browserbase Cloud Browser Navigation**: Automates public water dashboards in the `ap-southeast-1` region.
2. **Intelligent Normalization Engine**: Automatically reconciles disparate metric units ($\mu\text{g/L}$, $\text{ppb}$, $\text{ppm}$, $\text{NTU}$) into standardized units for comparison against **BIS IS 10500:2012** drinking water safety thresholds.
3. **Temporal Recency Classification**: Identifies and labels historical or stale samples (>180 days or from prior years) with municipal re-sampling alerts.
4. **Strict Safety Guardrails**: Guaranteed invariant that missing samples are reported as `'NO DATA'` and **NEVER** assumed `'SAFE'`.
5. **Human-in-the-Loop Permitted Action Gate**: Pauses before report publication to present a proposed change diff, requiring explicit reviewer authorization and using cryptographic content hashing (`sha256`) to guarantee idempotency and prevent duplicate executions.
6. **Supabase & Persistent Storage Vault**: Stores inputs, source evidence, parameter measurements, action states, and test results with ready-to-run Supabase schemas (`supabase_schema.sql`) and a dedicated **Database Vault** web interface.

---

## 📐 System Architecture

```
┌────────────────────────────────────────────────────────┐
│               AquaWard AI Web Dashboard                │
│   (Ward Selection, WQI Gauge, Live Console, Runner)    │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       [1. Trigger Input]       [4. Human Approval Gate]
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌───────────────────────┐
│     Agentic Action Loop       │ │   Report Compiler     │
│ - Browserbase Cloud Session   │ │ - BIS 10500 Audit     │
│ - Fetch & Navigation Engine   │ │ - Citizen Certificate │
│ - Unit Normalizer (µg ↔ mg)   │ │ - Idempotency Seal    │
│ - Historical Date Classifier  │ └───────────────────────┘
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Verification & Evidence Log  │
│ - Source URLs & Timestamps    │
│ - Browserbase Session Replay  │
│ - 4/4 Test Suite Automation   │
└───────────────────────────────┘
```

---

## 🧪 Official Test Suite Verification (100% Pass Rate - 4/4)

AquaWard AI comes with an integrated automated test suite validating all 4 mandatory hackathon scenarios:

| Test Case | Scenario | Expected Outcome | Actual Result | Status |
|---|---|---|---|:---:|
| **TC1** | **Ward Selected** | Results with sample date, place and units | Extracted complete lab assay with verified date (`2026-10-12`), location (`Indiranagar Main Sump Tap #04`), and normalized units. | **PASS** ✅ |
| **TC2** | **Sample From Last Year** | Labelled historical | Sample dated `2025-06-18` classified as `HISTORICAL (STALE - 492 days old)` with mandatory re-test advisory. | **PASS** ✅ |
| **TC3** | **mg/L and microgram/L values** | Normalised before comparison | Normalized Arsenic ($25\ \mu\text{g/L} \rightarrow 0.025\text{ mg/L}$) and Lead ($18\ \mu\text{g/L} \rightarrow 0.018\text{ mg/L}$) before checking against BIS 10500 limits. | **PASS** ✅ |
| **TC4** | **No sample for ward** | Reported 'no data', never 'safe' | Strictly returned status `'NO DATA'`; `isSafe` invariant is false; never reports safe. | **PASS** ✅ |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- Browserbase Account & API Credentials

### 2. Install Dependencies
```bash
cd Ziro_hackathon
npm install
```

### 3. Configure Environment Variables
Create or verify `.env`:
```env
BROWSERBASE_API_KEY=-
BROWSERBASE_PROJECT_ID=-
PORT=3000
NODE_ENV=development
```

### 4. Run Application
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Test Suite Directly via CLI
```bash
npm test
```

---

## 🛡️ Bureau of Indian Standards (BIS IS 10500:2012) Matrix

| Parameter | Standard Unit | BIS Acceptable Limit | BIS Permissible Limit | Health Classification |
|---|:---:|:---:|:---:|---|
| **pH** | pH | 6.5 | 8.5 | Physical / Chemical |
| **TDS** | mg/L | 500 | 2000 | General Palatability |
| **Turbidity** | NTU | 1.0 | 5.0 | Physical Clarity |
| **Fluoride (F)** | mg/L | 1.0 ($1000\ \mu\text{g/L}$) | 1.5 ($1500\ \mu\text{g/L}$) | Skeletal & Dental Health |
| **Arsenic (As)** | mg/L | 0.01 ($10\ \mu\text{g/L}$) | 0.05 ($50\ \mu\text{g/L}$) | Carcinogen / Heavy Metal |
| **Lead (Pb)** | mg/L | 0.01 ($10\ \mu\text{g/L}$) | 0.01 (No relaxation) | Neurotoxic Heavy Metal |
| **Nitrate (NO3)**| mg/L | 45.0 | 45.0 | Chemical Contaminant |
| **Coliform** | MPN/100mL | 0 | 0 | Microbiological Pathogen |

---

## 👥 Hackathon Team Credentials
- **Team:** CodeCatalyst
- **Team Leader:** Abishek M
- **Team Member (Builder):** Dhayananth N (`dhayananth1511@gmail.com`)
- **Assigned Problem:** Ward Water Quality Reporter
