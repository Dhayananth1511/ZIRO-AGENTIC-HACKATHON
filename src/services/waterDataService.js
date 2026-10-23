/**
 * Repository of Official Ward Water Quality Records from Public Government Dashboards:
 * - WQMIS (Water Quality Management Information System - Ministry of Jal Shakti)
 * - CPCB (Central Pollution Control Board)
 * - Urban Local Bodies / Municipal Water Supply & Sewerage Boards
 */

const WARD_DATABASE = [
  {
    wardId: 'WARD-42',
    wardNumber: 42,
    wardName: 'Indiranagar East',
    city: 'Bengaluru',
    state: 'Karnataka',
    sourceUrl: 'https://ejalshakti.gov.in/wqmis/reports/karnataka/ward-42',
    sourceDashboard: 'WQMIS - Jal Jeevan Mission Public Portal',
    laboratoryId: 'KSPCB-LAB-BNG-8821',
    samplingLocation: 'Indiranagar Main Distribution Sump & Ward 42 Public Tap #04',
    sampleDate: '2026-10-12',
    retrievalTime: '2026-10-23T10:15:00Z',
    testedBy: 'Senior Water Quality Analyst, BWSSB Regional Lab',
    testType: 'Quarterly Routine Municipal Potability Screen',
    parameters: [
      { paramKey: 'pH', rawValue: 7.2, rawUnit: 'pH' },
      { paramKey: 'tds', rawValue: 280, rawUnit: 'mg/L' },
      { paramKey: 'turbidity', rawValue: 0.8, rawUnit: 'NTU' },
      { paramKey: 'fluoride', rawValue: 0.6, rawUnit: 'mg/L' },
      { paramKey: 'nitrate', rawValue: 18.0, rawUnit: 'mg/L' },
      { paramKey: 'chlorine', rawValue: 0.4, rawUnit: 'mg/L' },
      { paramKey: 'coliform', rawValue: 0, rawUnit: 'MPN/100mL' }
    ]
  },
  {
    // TC2 SCENARIO: Sample from last year (2025)
    wardId: 'WARD-108',
    wardNumber: 108,
    wardName: 'Gandhinagar Old Colony',
    city: 'Hyderabad',
    state: 'Telangana',
    sourceUrl: 'https://cpcb.nic.in/water-quality-data/telangana/ward-108-archive',
    sourceDashboard: 'CPCB National Water Quality Monitoring Archive',
    laboratoryId: 'TSPCB-HYD-CENTRAL-401',
    samplingLocation: 'Gandhinagar Community Water Overhead Tank',
    sampleDate: '2025-06-18', // Stale sample from prior year
    retrievalTime: '2026-10-23T11:00:00Z',
    testedBy: 'Division Chemist, HMWSSB',
    testType: 'Annual Catchment Water Safety Assessment',
    parameters: [
      { paramKey: 'pH', rawValue: 7.8, rawUnit: 'pH' },
      { paramKey: 'tds', rawValue: 460, rawUnit: 'mg/L' },
      { paramKey: 'turbidity', rawValue: 1.2, rawUnit: 'NTU' },
      { paramKey: 'fluoride', rawValue: 0.9, rawUnit: 'mg/L' },
      { paramKey: 'nitrate', rawValue: 32.0, rawUnit: 'mg/L' },
      { paramKey: 'coliform', rawValue: 0, rawUnit: 'MPN/100mL' }
    ]
  },
  {
    // TC3 SCENARIO: Mixed mg/L and microgram/L values
    wardId: 'WARD-77',
    wardNumber: 77,
    wardName: 'Industrial Belt Phase 2',
    city: 'Chennai',
    state: 'Tamil Nadu',
    sourceUrl: 'https://cpcb.nic.in/industrial-clusters/ambattur-ward-77',
    sourceDashboard: 'TNPCB Environmental Surveillance Dashboard',
    laboratoryId: 'TNPCB-AMB-ENV-902',
    samplingLocation: 'Ward 77 Groundwater Sump & Community Well #2',
    sampleDate: '2026-10-15',
    retrievalTime: '2026-10-23T11:30:00Z',
    testedBy: 'Chief Toxicologist, King Institute of Preventive Medicine',
    testType: 'Heavy Metal & Toxic Element Surveillance',
    parameters: [
      // Arsenic is recorded in µg/L: 25 µg/L = 0.025 mg/L (Exceeds BIS limit of 0.01 mg/L!)
      { paramKey: 'arsenic', rawValue: 25.0, rawUnit: 'µg/L' },
      // Lead is recorded in microgram/L: 18 microgram/L = 0.018 mg/L (Exceeds BIS limit of 0.01 mg/L!)
      { paramKey: 'lead', rawValue: 18.0, rawUnit: 'microgram/L' },
      // Fluoride recorded in µg/L: 1400 µg/L = 1.4 mg/L (Permissible under emergency, but > acceptable 1.0 mg/L)
      { paramKey: 'fluoride', rawValue: 1400.0, rawUnit: 'µg/L' },
      // TDS recorded in standard mg/L: 740 mg/L
      { paramKey: 'tds', rawValue: 740, rawUnit: 'mg/L' },
      // Nitrate recorded in mg/L: 54.0 mg/L (Exceeds BIS limit of 45 mg/L!)
      { paramKey: 'nitrate', rawValue: 54.0, rawUnit: 'mg/L' },
      { paramKey: 'pH', rawValue: 6.4, rawUnit: 'pH' },
      { paramKey: 'turbidity', rawValue: 3.8, rawUnit: 'NTU' }
    ]
  },
  {
    // TC4 SCENARIO: No sample for ward
    // Specifically left out of registry to simulate absent testing records
    wardId: 'WARD-219',
    wardNumber: 219,
    wardName: 'New Extension Sector 14',
    city: 'Pune',
    state: 'Maharashtra',
    sourceUrl: 'https://pmc.gov.in/water-works/wards/ward-219',
    sourceDashboard: 'PMC Water Department Public Portal',
    laboratoryId: null,
    samplingLocation: null,
    sampleDate: null, // NO DATA
    retrievalTime: '2026-10-23T12:00:00Z',
    testedBy: null,
    testType: null,
    parameters: [] // Empty
  },
  {
    wardId: 'WARD-12',
    wardNumber: 12,
    wardName: 'T. Nagar Central',
    city: 'Chennai',
    state: 'Tamil Nadu',
    sourceUrl: 'https://chennaimetrowater.tn.gov.in/quality/ward-12',
    sourceDashboard: 'Chennai Metro Water Supply Portal',
    laboratoryId: 'CMWSSB-CENTRAL-LAB-12',
    samplingLocation: 'Panagal Park Distribution Booster Pump',
    sampleDate: '2026-10-19',
    retrievalTime: '2026-10-23T14:00:00Z',
    testedBy: 'Metrowater Quality Inspector',
    testType: 'Bi-weekly Municipal Chlorine & Potability Check',
    parameters: [
      { paramKey: 'pH', rawValue: 7.4, rawUnit: 'pH' },
      { paramKey: 'tds', rawValue: 350, rawUnit: 'mg/L' },
      { paramKey: 'turbidity', rawValue: 0.9, rawUnit: 'NTU' },
      { paramKey: 'fluoride', rawValue: 0.7, rawUnit: 'mg/L' },
      { paramKey: 'chlorine', rawValue: 0.5, rawUnit: 'mg/L' },
      { paramKey: 'coliform', rawValue: 0, rawUnit: 'MPN/100mL' }
    ]
  },
  {
    wardId: 'WARD-150',
    wardNumber: 150,
    wardName: 'Bellandur Lake Catchment',
    city: 'Bengaluru',
    state: 'Karnataka',
    sourceUrl: 'https://bwssb.karnataka.gov.in/water-reports/ward-150',
    sourceDashboard: 'BWSSB Ward Surveillance System',
    laboratoryId: 'BWSSB-BELLANDUR-09',
    samplingLocation: 'Ward 150 Borewell Feeder Line',
    sampleDate: '2026-10-05',
    retrievalTime: '2026-10-23T15:00:00Z',
    testedBy: 'Urban Hydro-geologist',
    testType: 'Comprehensive Biological & Chemical Assay',
    parameters: [
      { paramKey: 'pH', rawValue: 8.6, rawUnit: 'pH' }, // Alkaline
      { paramKey: 'tds', rawValue: 1120, rawUnit: 'mg/L' }, // High TDS
      { paramKey: 'turbidity', rawValue: 4.2, rawUnit: 'NTU' },
      { paramKey: 'fluoride', rawValue: 1.8, rawUnit: 'mg/L' }, // Exceeds permissible
      { paramKey: 'coliform', rawValue: 12, rawUnit: 'MPN/100mL' }, // Coliform contamination
      { paramKey: 'nitrate', rawValue: 48.0, rawUnit: 'mg/L' }
    ]
  }
];

function getAllWards() {
  return WARD_DATABASE.map(w => ({
    wardId: w.wardId,
    wardNumber: w.wardNumber,
    wardName: w.wardName,
    city: w.city,
    state: w.state,
    hasData: w.parameters.length > 0 && !!w.sampleDate,
    sourceDashboard: w.sourceDashboard
  }));
}

function getWardRecord(wardId) {
  const normalizedId = (wardId || '').toUpperCase().trim();
  return WARD_DATABASE.find(w => 
    w.wardId === normalizedId || 
    w.wardNumber.toString() === normalizedId ||
    `WARD-${w.wardNumber}` === normalizedId ||
    w.wardName.toLowerCase().includes(wardId.toLowerCase())
  );
}

module.exports = {
  WARD_DATABASE,
  getAllWards,
  getWardRecord
};
