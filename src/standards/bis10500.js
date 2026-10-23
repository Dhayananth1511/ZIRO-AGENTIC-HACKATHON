/**
 * Bureau of Indian Standards (BIS IS 10500: 2012) Drinking Water Specifications
 * Used by CPCB, Jal Jeevan Mission (JJM), and Municipal Water Boards in Bharat
 */

const BIS_STANDARDS = {
  pH: {
    name: 'pH Value',
    standardUnit: 'pH',
    acceptableLimit: 6.5,
    permissibleLimit: 8.5,
    minAcceptable: 6.5,
    maxAcceptable: 8.5,
    type: 'range',
    category: 'Physical & Chemical',
    description: 'Measure of acidity or alkalinity of water.',
    healthImpact: 'Outside 6.5-8.5 causes taste alterations, corrosion of pipes, or mucosal irritation.'
  },
  tds: {
    name: 'Total Dissolved Solids (TDS)',
    standardUnit: 'mg/L',
    acceptableLimit: 500,
    permissibleLimit: 2000,
    type: 'upper_bound',
    category: 'General Parameters',
    description: 'Inorganic salts and small amounts of organic matter dissolved in water.',
    healthImpact: 'Above 500 mg/L imparts unpleasant mineral taste; above 2000 mg/L unsuitable for consumption.'
  },
  turbidity: {
    name: 'Turbidity',
    standardUnit: 'NTU',
    acceptableLimit: 1.0,
    permissibleLimit: 5.0,
    type: 'upper_bound',
    category: 'Physical Parameters',
    description: 'Cloudiness or haziness of fluid caused by suspended solids.',
    healthImpact: 'High turbidity interferes with disinfection and shelters microbial pathogens.'
  },
  fluoride: {
    name: 'Fluoride (as F)',
    standardUnit: 'mg/L',
    acceptableLimit: 1.0,
    permissibleLimit: 1.5,
    type: 'upper_bound',
    category: 'Toxic Substances',
    description: 'Naturally occurring mineral compound in groundwater.',
    healthImpact: '>1.0 mg/L causes dental fluorosis; >1.5 mg/L leads to crippling skeletal fluorosis.'
  },
  arsenic: {
    name: 'Arsenic (as As)',
    standardUnit: 'mg/L',
    acceptableLimit: 0.01,
    permissibleLimit: 0.05,
    type: 'upper_bound',
    category: 'Heavy Metals / Carcinogens',
    description: 'Highly toxic metalloid in deep alluvial aquifers.',
    healthImpact: 'Known Group 1 carcinogen causing skin keratosis, cardiovascular disease, and cancer.'
  },
  lead: {
    name: 'Lead (as Pb)',
    standardUnit: 'mg/L',
    acceptableLimit: 0.01,
    permissibleLimit: 0.01, // No relaxation in BIS 10500
    type: 'upper_bound',
    category: 'Toxic Heavy Metals',
    description: 'Neurotoxic heavy metal from aged plumbing and industrial runoff.',
    healthImpact: 'Irreversible neurological impairment, cognitive deficits in children, kidney damage.'
  },
  nitrate: {
    name: 'Nitrate (as NO3)',
    standardUnit: 'mg/L',
    acceptableLimit: 45.0,
    permissibleLimit: 45.0, // No relaxation in BIS 10500
    type: 'upper_bound',
    category: 'Chemical Contaminants',
    description: 'Byproduct of agricultural fertilizers and sewage seepage.',
    healthImpact: 'Causes Methemoglobinemia (Blue Baby Syndrome) in infants; thyroid hypertrophy.'
  },
  chlorine: {
    name: 'Residual Free Chlorine',
    standardUnit: 'mg/L',
    minAcceptable: 0.2,
    maxAcceptable: 1.0,
    acceptableLimit: 0.2,
    permissibleLimit: 1.0,
    type: 'range',
    category: 'Disinfection',
    description: 'Active chlorine residual ensuring biological safety during distribution.',
    healthImpact: '<0.2 mg/L allows bacterial regrowth; >1.0 mg/L causes pungent odor and irritation.'
  },
  coliform: {
    name: 'Total Coliform Bacteria',
    standardUnit: 'MPN/100mL',
    acceptableLimit: 0,
    permissibleLimit: 0,
    type: 'zero_tolerance',
    category: 'Microbiological',
    description: 'Indicator organisms of fecal or sewage contamination.',
    healthImpact: 'Indicates presence of pathogenic bacteria, viruses, or parasites causing acute gastroenteritis.'
  }
};

module.exports = {
  BIS_STANDARDS
};
