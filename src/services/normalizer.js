const { BIS_STANDARDS } = require('../standards/bis10500');

/**
 * Normalizes values across different units (mg/L, µg/L, ppb, ppm, etc.)
 * to standard BIS 10500 metric units.
 */
function normalizeParameter(paramKey, rawValue, rawUnit) {
  const standard = BIS_STANDARDS[paramKey];
  if (!standard) {
    return {
      paramKey,
      rawValue,
      rawUnit,
      normalizedValue: rawValue,
      normalizedUnit: rawUnit,
      standardUnit: rawUnit,
      status: 'UNKNOWN',
      compliance: 'Unknown parameter'
    };
  }

  const cleanUnit = (rawUnit || '').trim().toLowerCase();
  let normalizedValue = parseFloat(rawValue);
  let conversionFactor = 1;
  let formula = 'Direct (1:1)';

  if (isNaN(normalizedValue)) {
    return {
      paramKey,
      name: standard.name,
      rawValue,
      rawUnit,
      normalizedValue: null,
      normalizedUnit: standard.standardUnit,
      status: 'INVALID_DATA',
      compliance: 'Cannot parse numerical measurement'
    };
  }

  // Handle unit conversions to mg/L
  if (standard.standardUnit === 'mg/L') {
    if (['µg/l', 'ug/l', 'microgram/l', 'micrograms/l', 'mcg/l', 'ppb'].includes(cleanUnit)) {
      // 1000 µg/L = 1 mg/L -> normalizedValue = rawValue / 1000
      normalizedValue = normalizedValue / 1000;
      conversionFactor = 0.001;
      formula = `${rawValue} ${rawUnit} ÷ 1000 = ${normalizedValue} mg/L`;
    } else if (['ppm', 'parts per million'].includes(cleanUnit)) {
      // 1 ppm = 1 mg/L in water density
      conversionFactor = 1;
      formula = `${rawValue} ppm = ${normalizedValue} mg/L`;
    } else if (cleanUnit === 'g/l') {
      normalizedValue = normalizedValue * 1000;
      conversionFactor = 1000;
      formula = `${rawValue} g/L × 1000 = ${normalizedValue} mg/L`;
    }
  }

  // Round normalizedValue to 4 decimal places for precision without float noise
  normalizedValue = Math.round(normalizedValue * 10000) / 10000;

  // Evaluate against BIS standard thresholds
  const evaluation = evaluateCompliance(standard, normalizedValue);

  return {
    paramKey,
    name: standard.name,
    category: standard.category,
    rawValue,
    rawUnit,
    normalizedValue,
    normalizedUnit: standard.standardUnit,
    unitConversion: {
      applied: conversionFactor !== 1,
      factor: conversionFactor,
      formula
    },
    acceptableLimit: standard.acceptableLimit,
    permissibleLimit: standard.permissibleLimit,
    status: evaluation.status,
    isSafe: evaluation.isSafe,
    badgeClass: evaluation.badgeClass,
    message: evaluation.message,
    healthImpact: standard.healthImpact
  };
}

/**
 * Checks compliance with BIS IS 10500 limits
 */
function evaluateCompliance(standard, val) {
  if (standard.type === 'range') {
    if (val >= standard.minAcceptable && val <= standard.maxAcceptable) {
      return { status: 'SAFE', isSafe: true, badgeClass: 'badge-safe', message: `Within ideal range (${standard.minAcceptable} - ${standard.maxAcceptable})` };
    } else if (val >= 6.0 && val <= 9.0) {
      return { status: 'PERMISSIBLE', isSafe: true, badgeClass: 'badge-warning', message: `Tolerable in absence of alternate source (6.0 - 9.0)` };
    } else {
      return { status: 'HAZARDOUS', isSafe: false, badgeClass: 'badge-danger', message: `Exceeds permissible safety range (${standard.minAcceptable} - ${standard.maxAcceptable})` };
    }
  }

  if (standard.type === 'zero_tolerance') {
    if (val === 0) {
      return { status: 'SAFE', isSafe: true, badgeClass: 'badge-safe', message: 'Compliant (0 MPN/100mL)' };
    } else {
      return { status: 'HAZARDOUS', isSafe: false, badgeClass: 'badge-danger', message: `Biological contamination detected (${val} MPN/100mL)!` };
    }
  }

  // Upper bound check (e.g. Arsenic, Lead, Fluoride, TDS, Nitrate)
  if (val <= standard.acceptableLimit) {
    return { status: 'SAFE', isSafe: true, badgeClass: 'badge-safe', message: `Within acceptable limit (≤ ${standard.acceptableLimit} ${standard.standardUnit})` };
  } else if (val <= standard.permissibleLimit) {
    return { status: 'PERMISSIBLE', isSafe: true, badgeClass: 'badge-warning', message: `Acceptable in absence of alternate source (≤ ${standard.permissibleLimit} ${standard.standardUnit})` };
  } else {
    return { status: 'HAZARDOUS', isSafe: false, badgeClass: 'badge-danger', message: `VIOLATION: Exceeds permissible limit (> ${standard.permissibleLimit} ${standard.standardUnit})` };
  }
}

/**
 * Evaluates whether a sample is from a previous year or stale.
 * TC2 REQUIREMENT: Sample from last year -> expected: labelled historical
 */
function classifySampleRecency(sampleDateStr, referenceYear = 2026) {
  if (!sampleDateStr) {
    return {
      isHistorical: false,
      sampleYear: null,
      ageInDays: null,
      label: 'DATE_UNKNOWN',
      badgeClass: 'badge-unknown',
      description: 'Sample date is missing or not documented.'
    };
  }

  const sampleDate = new Date(sampleDateStr);
  const sampleYear = sampleDate.getFullYear();
  const currentRefDate = new Date(referenceYear, 9, 23); // Current reference Oct 2026
  const diffTime = currentRefDate.getTime() - sampleDate.getTime();
  const diffDays = Math.max(0, Math.round(diffTime / (1000 * 3600 * 24)));

  if (sampleYear < referenceYear || diffDays > 180) {
    return {
      isHistorical: true,
      sampleYear,
      ageInDays: diffDays,
      label: 'HISTORICAL',
      badgeClass: 'badge-historical',
      tag: 'LABELLED HISTORICAL (STALE)',
      warning: `Data is from ${sampleYear} (${diffDays} days old). Municipal conditions may have altered significantly. Mandatory fresh re-sampling recommended.`
    };
  }

  return {
    isHistorical: false,
    sampleYear,
    ageInDays: diffDays,
    label: 'CURRENT',
    badgeClass: 'badge-current',
    tag: 'ACTIVE MONITORING CYCLE',
    warning: null
  };
}

/**
 * Calculates a standard Water Quality Index (WQI) score from 0 to 100
 */
function calculateWaterQualityIndex(normalizedParameters) {
  if (!normalizedParameters || normalizedParameters.length === 0) {
    return { score: null, classification: 'NO_DATA', description: 'No water parameters recorded.' };
  }

  let totalWeight = 0;
  let weightedScore = 0;
  let hasCriticalHazard = false;

  // Weights based on toxicity & public health priority
  const weights = {
    coliform: 5,
    arsenic: 5,
    lead: 5,
    fluoride: 4,
    nitrate: 3,
    turbidity: 2,
    pH: 2,
    tds: 2,
    chlorine: 2
  };

  for (const param of normalizedParameters) {
    const w = weights[param.paramKey] || 1;
    totalWeight += w;

    if (param.status === 'HAZARDOUS') {
      weightedScore += 0 * w;
      if (['coliform', 'arsenic', 'lead', 'fluoride'].includes(param.paramKey)) {
        hasCriticalHazard = true;
      }
    } else if (param.status === 'PERMISSIBLE') {
      weightedScore += 65 * w;
    } else if (param.status === 'SAFE') {
      weightedScore += 100 * w;
    }
  }

  let finalScore = Math.round(weightedScore / totalWeight);
  if (hasCriticalHazard && finalScore > 45) {
    finalScore = 42; // Cap score if critical toxicity is present
  }

  let classification = 'EXCELLENT';
  let color = '#10B981'; // emerald
  if (finalScore >= 85) {
    classification = 'EXCELLENT (POTABLE)';
    color = '#10B981';
  } else if (finalScore >= 70) {
    classification = 'GOOD (TOLERABLE)';
    color = '#3B82F6';
  } else if (finalScore >= 50) {
    classification = 'MODERATE (REQUIRES FILTRATION)';
    color = '#F59E0B';
  } else {
    classification = 'POOR / UNFIT FOR DIRECT DRINKING';
    color = '#EF4444';
  }

  return {
    score: finalScore,
    classification,
    color,
    hasCriticalHazard
  };
}

module.exports = {
  normalizeParameter,
  classifySampleRecency,
  calculateWaterQualityIndex
};
